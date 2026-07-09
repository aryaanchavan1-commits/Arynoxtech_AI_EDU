using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ArynoxEDULauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new LauncherForm());
        }
    }

    public class LauncherForm : Form
    {
        private Label statusLabel;
        private ProgressBar progressBar;
        private Button startBtn, browseBtn;
        private RichTextBox logBox;
        private NotifyIcon trayIcon;
        private Process? serverProcess;
        private bool isRunning;
        private int port = 3000;
        private readonly string appDir;

        public LauncherForm()
        {
            appDir = AppDomain.CurrentDomain.BaseDirectory;

            Text = "Arynox-EDU Launcher";
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            ClientSize = new Size(520, 400);
            BackColor = Color.FromArgb(10, 10, 15);
            ForeColor = Color.White;
            Font = new Font("Segoe UI", 9);

            BuildUI();
            SetupTray();
            _ = CheckPrerequisitesAsync();
        }

        private void BuildUI()
        {
            var title = new Label
            {
                Text = "Arynox-EDU Launcher",
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 18, FontStyle.Bold),
                Location = new Point(20, 15),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            statusLabel = new Label
            {
                Text = "Checking prerequisites...",
                ForeColor = Color.FromArgb(161, 161, 170),
                Location = new Point(20, 55),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            progressBar = new ProgressBar
            {
                Location = new Point(20, 80),
                Width = 480,
                Height = 4,
                Style = ProgressBarStyle.Marquee,
                MarqueeAnimationSpeed = 30,
                Visible = true,
                ForeColor = Color.FromArgb(124, 58, 237),
                BackColor = Color.FromArgb(30, 30, 40)
            };

            logBox = new RichTextBox
            {
                Location = new Point(20, 100),
                Width = 480,
                Height = 180,
                ReadOnly = true,
                BackColor = Color.FromArgb(10, 10, 15),
                ForeColor = Color.FromArgb(161, 161, 170),
                Font = new Font("Consolas", 8),
                BorderStyle = BorderStyle.None
            };

            startBtn = MakeButton("▶  Start", 20, 300, Color.FromArgb(124, 58, 237), Color.White);
            startBtn.Click += StartClick;

            browseBtn = MakeButton("🌐  Open Browser", 185, 300, Color.FromArgb(30, 30, 40), Color.White);
            browseBtn.Enabled = false;
            browseBtn.Click += (s, e) => Process.Start(new ProcessStartInfo($"http://localhost:{port}") { UseShellExecute = true });

            var exitBtn = MakeButton("Exit", 350, 300, Color.FromArgb(30, 30, 40), Color.FromArgb(161, 161, 170));
            exitBtn.Click += (s, e) => Shutdown();

            Controls.Add(title);
            Controls.Add(statusLabel);
            Controls.Add(progressBar);
            Controls.Add(logBox);
            Controls.Add(startBtn);
            Controls.Add(browseBtn);
            Controls.Add(exitBtn);
        }

        private Button MakeButton(string text, int x, int y, Color bg, Color fg)
        {
            return new Button
            {
                Text = text,
                Location = new Point(x, y),
                Width = 150,
                Height = 36,
                FlatStyle = FlatStyle.Flat,
                FlatAppearance = { BorderColor = Color.FromArgb(60, 60, 70), BorderSize = 1 },
                BackColor = bg,
                ForeColor = fg,
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
        }

        private void SetupTray()
        {
            var menu = new ContextMenuStrip();
            menu.Items.Add("Open", null, (s, e) => Process.Start(new ProcessStartInfo($"http://localhost:{port}") { UseShellExecute = true }));
            menu.Items.Add("Show", null, (s, e) => { Show(); WindowState = FormWindowState.Normal; });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Exit", null, (s, e) => Shutdown());

            trayIcon = new NotifyIcon
            {
                Text = "Arynox-EDU",
                Icon = SystemIcons.Application,
                ContextMenuStrip = menu,
                Visible = true
            };
            trayIcon.DoubleClick += (s, e) => { Show(); WindowState = FormWindowState.Normal; };
        }

        private async Task CheckPrerequisitesAsync()
        {
            Log("Checking Node.js...");
            var node = FindNode();
            if (node == null)
            {
                Log("❌ Node.js not found. Install from https://nodejs.org");
                SetStatus("❌ Node.js required", false);
                return;
            }
            Log($"✔ Node.js: {GetVersion("node", "--version")}");

            var npm = node.Replace("node.exe", "npm.cmd");
            if (!File.Exists(Path.Combine(appDir, "node_modules", "next", "package.json")))
            {
                Log("Installing dependencies...");
                SetStatus("Installing npm packages...", true);
                RunCmd(npm, "install --no-audit --no-fund", appDir);
            }

            if (!File.Exists(Path.Combine(appDir, ".env")) && File.Exists(Path.Combine(appDir, ".env.example")))
            {
                File.Copy(Path.Combine(appDir, ".env.example"), Path.Combine(appDir, ".env"), false);
                Log("Created .env from .env.example");
            }

            // Check if build exists
            if (!File.Exists(Path.Combine(appDir, ".next", "BUILD_ID")))
            {
                Log("⚡ No production build. Run 'npm run build' for faster startup.");
                Log("   (dev mode will be used for now)");
            }
            else
            {
                Log("✔ Production build detected");
            }

            SetStatus("✅ Ready — click Start", false);
        }

        private async void StartClick(object? sender, EventArgs e)
        {
            if (isRunning) { Shutdown(); return; }
            await StartServer();
        }

        private async Task StartServer()
        {
            isRunning = true;
            startBtn.Text = "⏹  Stop";
            browseBtn.Enabled = false;
            SetStatus("Starting server...", true);

            try
            {
                var node = FindNode();
                if (node == null) { Log("❌ Node.js missing"); return; }

                var isDev = !File.Exists(Path.Combine(appDir, ".next", "BUILD_ID"));
                var mode = isDev ? "dev" : "start";
                Log($"Starting Next.js ({mode} mode) on port {port}...");

                var psi = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c cd /d \"{appDir}\" && {node} node_modules\\next\\dist\\bin\\next {mode} --port {port}",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                serverProcess = new Process { StartInfo = psi };
                serverProcess.OutputDataReceived += (s, args) => { if (args.Data != null) Log(args.Data); };
                serverProcess.ErrorDataReceived += (s, args) => { if (args.Data != null) Log("⚠ " + args.Data); };
                serverProcess.Start();
                serverProcess.BeginOutputReadLine();
                serverProcess.BeginErrorReadLine();

                // Wait for server
                using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
                for (int i = 0; i < 45; i++)
                {
                    try
                    {
                        var resp = await client.GetAsync($"http://localhost:{port}/api/health");
                        if (resp.IsSuccessStatusCode)
                        {
                            Log($"✔ Server ready on http://localhost:{port}");
                            SetStatus("🟢 Running", false);
                            browseBtn.Enabled = true;
                            startBtn.Text = "⏹  Stop";
                            trayIcon.ShowBalloonTip(2000, "Arynox-EDU", "Server is running!", ToolTipIcon.Info);
                            Process.Start(new ProcessStartInfo($"http://localhost:{port}") { UseShellExecute = true });
                            return;
                        }
                    }
                    catch { }
                    await Task.Delay(1500);
                }

                Log("❌ Server did not start in time. Check logs above.");
                SetStatus("❌ Failed to start", false);
                isRunning = false;
                startBtn.Text = "▶  Start";
            }
            catch (Exception ex)
            {
                Log("❌ Error: " + ex.Message);
                SetStatus("❌ Error", false);
                isRunning = false;
                startBtn.Text = "▶  Start";
            }
        }

        private string? FindNode()
        {
            // Try PATH
            try
            {
                var psi = new ProcessStartInfo("where", "node")
                {
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };
                var p = Process.Start(psi);
                if (p != null)
                {
                    var o = p.StandardOutput.ReadToEnd().Trim();
                    if (!string.IsNullOrEmpty(o)) return o.Split('\n')[0].Trim();
                }
            }
            catch { }

            var candidates = new[]
            {
                @"C:\Program Files\nodejs\node.exe",
                @"C:\Program Files (x86)\nodejs\node.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "fnm", "aliases", "default", "node.exe")
            };
            foreach (var c in candidates)
                if (File.Exists(c)) return c;

            return null;
        }

        private string GetVersion(string exe, string arg)
        {
            try
            {
                var psi = new ProcessStartInfo(exe, arg)
                {
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };
                var p = Process.Start(psi);
                return p?.StandardOutput.ReadToEnd().Trim() ?? "unknown";
            }
            catch { return "unknown"; }
        }

        private void RunCmd(string exe, string args, string cwd)
        {
            try
            {
                var psi = new ProcessStartInfo(exe, args)
                {
                    WorkingDirectory = cwd,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                var p = Process.Start(psi);
                p?.WaitForExit(180000);
            }
            catch (Exception ex) { Log("⚠ " + ex.Message); }
        }

        private void SetStatus(string text, bool showProgress)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => SetStatus(text, showProgress)));
                return;
            }
            statusLabel.Text = text;
            progressBar.Visible = showProgress;
        }

        private void Log(string msg)
        {
            if (logBox.InvokeRequired)
            {
                logBox.Invoke(new Action(() => Log(msg)));
                return;
            }
            logBox.AppendText($"[{DateTime.Now:HH:mm:ss}] {msg}\n");
            logBox.ScrollToCaret();
        }

        private void Shutdown()
        {
            try { serverProcess?.Kill(); } catch { }
            trayIcon?.Dispose();
            Application.Exit();
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            e.Cancel = true;
            Hide();
            trayIcon?.ShowBalloonTip(2000, "Arynox-EDU", "Running in system tray", ToolTipIcon.Info);
        }
    }
}