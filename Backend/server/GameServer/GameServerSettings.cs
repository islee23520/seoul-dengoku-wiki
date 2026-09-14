using System.Collections.Generic;

namespace SeoulKenshi.GameServer
{
    /// <summary>
    /// appsettings.json의 "GameServer" 섹션에 바인딩되는 설정 클래스.
    /// DOTNET_ENVIRONMENT 환경변수에 따라 appsettings.{Environment}.json이 자동으로 오버라이드됩니다.
    /// </summary>
    public class GameServerSettings
    {
        public string Version { get; set; } = "0.0.1";
        public string Region { get; set; } = "DEV";
        public bool EnableHelper { get; set; } = true;
        public bool EnableGZipCompression { get; set; }
        public bool IsWritePacketTraceLog { get; set; } = true;
        public bool UseWordWrapPacketLog { get; set; }
        public bool PacketProcessLock { get; set; } = true;
        public int GamePort { get; set; } = 1219;
        public int GMSPort { get; set; } = 1003;
        public int MaxBufferSize { get; set; } = 102400;
        public int MaxConcurrentCalls { get; set; } = 1000;
        public int MaxConcurrentSessions { get; set; } = 200;
        public string LogPath { get; set; } = "./Log";
        public int LogExpireDays { get; set; } = 30;
        public int CheckEventTimeSecond { get; set; } = 60;
        public int CheckIgnoreWordTimeSecond { get; set; } = 5;
        public List<string> AcceptIP { get; set; } = new List<string>();
    }
}
