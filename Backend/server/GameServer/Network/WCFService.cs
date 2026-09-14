using System.Threading.Tasks;
using log4net;
using SeoulKenshi.Common.Log;
using Y2K.Core.Web.WCF.Framework;

namespace SeoulKenshi.GameServer
{
    public class WCFService : WcfHttpServerCore
    {
        public async Task StartAsync()
        {
            var log = LogManager.GetLogger(LogName.Debug);

            log.Info("start WCF Service initialize.....");

            await base.StartServiceAsync(
                "my company",
                "wcf template",
                "SeoulKenshi.Common.DLL",
                Config.Instance.Settings.GamePort,
                Config.Instance.Settings.MaxBufferSize,
                Config.Instance.Settings.MaxConcurrentCalls,
                Config.Instance.Settings.MaxConcurrentSessions,
                Config.Instance.Settings.EnableHelper,
                Config.Instance.Settings.EnableGZipCompression).ConfigureAwait(false);

            log.Info("WCF Service Running.....");
            log.Info($"Client connection base url: {BaseAddress}");

            if (EnableHelpPage == true)
            {
                log.Info($"Help Page Enabled - {BaseAddress}/Help/DefaultPage");
            }

            if (EnableZipCompression == true)
            {
                log.Info("protocol is zip mode.");
            }
            else
            {
                log.Info("protocol is text mode.");
            }
        }

        protected override void RegistWebService()
        {
            RegistService(typeof(Service.Front.CService), typeof(Service.Front.IService), "Front");
            RegistService(typeof(Service.Auth.CService), typeof(Service.Auth.IService), "Auth");
            RegistService(typeof(Service.Hero.CService), typeof(Service.Hero.IService), "Hero");
            RegistService(typeof(Service.Lobby.CService), typeof(Service.Lobby.IService), "Lobby");
        }
    }
}
