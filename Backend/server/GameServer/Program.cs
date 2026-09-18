using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SeoulKenshi.Cache.Redis;
using SeoulKenshi.Common.Log;
using SeoulKenshi.DB;
using SeoulKenshi.GameServer.Service;
using Y2K.Core.Util;

namespace SeoulKenshi.GameServer
{
    class Program
    {
        static HighResTimer timer10Sec;            //타이머
        static HighResTimer timer1Min;            //타이머
        static WCFService wcfService = new WCFService();
        static DateTime timeCheckingLog = DateTime.Now;
        static GameServerSettings settings;
        static IConfiguration configuration;

        static async Task Main(string[] args)
        {
            //Excpetion 핸들러 설정
            AppDomain CurrentDomain = AppDomain.CurrentDomain;
            CurrentDomain.UnhandledException += new UnhandledExceptionEventHandler(ExceptionHandler);

            string logFilePath = AppDomain.CurrentDomain.BaseDirectory + @"Log.config";
            FileInfo finfo = new FileInfo(logFilePath);
            log4net.Config.XmlConfigurator.ConfigureAndWatch(finfo);

            var hostBuilder = Host.CreateDefaultBuilder(args);
            if (OperatingSystem.IsWindows())
            {
                hostBuilder = hostBuilder.UseWindowsService(options =>
                {
                    options.ServiceName = "GameServer";
                });
            }

            var host = hostBuilder
                .ConfigureAppConfiguration((context, config) =>
                {
                    var env = context.HostingEnvironment.EnvironmentName;
                    config.SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
                        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                        .AddJsonFile($"appsettings.{env}.json", optional: true, reloadOnChange: true)
                        .AddEnvironmentVariables();
                })
                .ConfigureServices((context, services) =>
                {
                    services.Configure<GameServerSettings>(context.Configuration.GetSection("GameServer"));
                    settings = context.Configuration.GetSection("GameServer").Get<GameServerSettings>();
                    configuration = context.Configuration;
                    services.AddSingleton(settings);
                    services.AddHostedService<GameServerWorker>();
                })
                .Build();

            await host.RunAsync().ConfigureAwait(false);
        }

        /// <summary>
        /// BackgroundService: 콘솔/서비스 모드 공용 워커
        /// UseWindowsService()가 실행 환경을 자동 감지하여
        /// 콘솔이면 Ctrl+C, 서비스면 SCM stop 시그널로 종료됨
        /// </summary>
        class GameServerWorker : BackgroundService
        {
            protected override async Task ExecuteAsync(CancellationToken stoppingToken)
            {
                await ConsoleMain().ConfigureAwait(false);

                try
                {
                    await Task.Delay(Timeout.Infinite, stoppingToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    // 정상 종료 시그널
                }

                await ShutdownAsync().ConfigureAwait(false);
            }
        }

        public static async Task ConsoleMain()
        {
            try
            {
                var log = log4net.LogManager.GetLogger(LogName.Debug);

                log.Info("=============================================================================");
                DBConfig.Instance.Init(configuration.GetConnectionString("GlobalDB"));

                log.Info("Set Redis Clients.....");
                RedisCacheManager.Instance.Init(DBConfig.Instance.GetConnectionString("CACHE"));

                log.Info("Start to Game Server.....");

                log.Info("Load Definition data From Database .....");
                Config.Instance.Init(settings);

                await wcfService.StartAsync().ConfigureAwait(false);

                log.Info("Start Session Relay Hub .....");
                await Realtime.RelayHost.StartAsync(settings.RealtimePort).ConfigureAwait(false);
                log.Info($"Session Relay Hub Running..... port: {Realtime.RelayHost.Port}");

                //프로세스 타이머
                log.Info("Set Process Timmer(interval: 1 min)");
                timer1Min = new HighResTimer();
                timer1Min.Start(1000 * 60, new HighResTimer.TimerCallBack(OneMinuteProcess));

                log.Info("Set Process Timmer(interval: 10 sec)");
                timer10Sec = new HighResTimer();
                timer10Sec.Start(1000 * 10, new HighResTimer.TimerCallBack(Check10SecProcess));

                log.Info("Success to all running process..");

                log.Info("Wcf Game Server service Start....");
            }

            catch (Exception e)
            {
                var Log = log4net.LogManager.GetLogger(LogName.Debug);
                Log.Fatal("Service initialization fail.", e);
                await ShutdownAsync().ConfigureAwait(false);
                throw;
            }
        }

        static async Task ShutdownAsync()
        {
            timer10Sec?.Stop();
            timer1Min?.Stop();
            await Realtime.RelayHost.StopAsync().ConfigureAwait(false);
            await wcfService.StopServiceAsync().ConfigureAwait(false);
            var Log = log4net.LogManager.GetLogger(LogName.Debug);
            Log.Info("Stop Service.");
        }

        static async void ExceptionHandler(object sender, UnhandledExceptionEventArgs args)
        {
            Exception e = (Exception)args.ExceptionObject;
            var Log = log4net.LogManager.GetLogger(LogName.Debug);
            Log.Fatal("MyHandler:" + e.ToString());
            await ShutdownAsync().ConfigureAwait(false);
        }

        #region 프로세스 루틴
            /// <summary>
            /// 1분 Timer 처리 루틴
            /// </summary>
        internal static void OneMinuteProcess()
        {
            try
            {
                // 오래된 파일 로그를 지워준다.
                CheckLogFiles("Log", settings.LogExpireDays);

            }
            catch (Exception e)
            {
                var Log = log4net.LogManager.GetLogger(LogName.Debug);
                Log.Fatal(e.ToString());
            }
        }
        internal static void Check10SecProcess()
        {
            try
            {
                // 호스트 세션 생존 스윕(ADR-005): 호스트 무응답 세션 마감, 무응답 게스트 퇴장.
                Realtime.RelayHost.RunSweep();
            }
            catch (Exception e)
            {
                var Log = log4net.LogManager.GetLogger(LogName.Debug);
                Log.Fatal(e.ToString());
            }
        }
        internal static void CheckNewSpecData()
        {
            var oldVersion = Config.Instance.SpecVersion;

            var cacheClient = RedisCacheManager.Instance.GetSystemCacheClient();
            var newVersion = cacheClient.GetSpecVersion();
            if (string.IsNullOrEmpty(newVersion) == true)
            {
                return;
            }

            if (newVersion == oldVersion)
            {
                return;
            }

            Config.Instance.InitSpecData(newVersion);
        }
        internal static void CheckLogFiles(string folder, int expireDays)
        {
            if (timeCheckingLog > DateTime.Now)
            {
                return;
            }

            timeCheckingLog.AddDays(1);

            var logFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, folder);
            if (Directory.Exists(logFilePath) == false)
            {
                return;
            }

            var expireDate = DateTime.Now.AddDays(-1 * expireDays);
            var files = Directory.GetFiles(logFilePath, "*");

            foreach(var file in files)
            {
                var fileInfo = new FileInfo(file);
                if (fileInfo.LastWriteTime > expireDate)
                {
                    continue;
                }

                File.Delete(file);
            }
        }
        #endregion
    }
}
