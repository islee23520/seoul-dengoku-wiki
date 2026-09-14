using System.Runtime.Serialization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using SeoulKenshi.Common;
using SeoulKenshi.Protocols.Common;
using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Protocols.WCF
{
    [DataContract]
    public abstract class BaseWebPacket : BasePacket
    {
        [DataMember, PropertyDesc("유저 고유 키")]
        public long AccountIdx { get; set; }

        public override string GetUserKey()
        {
            return AccountIdx.ToString();
        }

        public sealed override string ToString()
        {
            StringBuilder s = new StringBuilder();

            s.AppendFormat($"[{GetType().Name}] - [AccountIdx:{AccountIdx}] - ");
            s.Append(JsonSerializer.Serialize(this, GetType()));

            return s.ToString();
        }
    }

    [DataContract]
    public abstract class BaseWebPacketResult : BasePacket, IErrorCode
    {
        [DataMember, PropertyDesc("공통 에러 코드")]
        public int ErrorCode { get; set; }

        [DataMember, PropertyDesc("세부 에러 메세지")]
        public string ErrorMessage { get; set; }

        public long AccountIdx { get; set; }

        #region 생성자
        public BaseWebPacketResult() { }
        public BaseWebPacketResult(long accountIdx)
        {
            AccountIdx = accountIdx;
            ErrorCode = 0;
            ErrorMessage = "SUCCESS";
        }
        #endregion

        public override string GetUserKey()
        {
            return AccountIdx.ToString();
        }

        public sealed override string ToString()
        {
            StringBuilder s = new StringBuilder();

            s.AppendFormat($"[{GetType().Name}] - [AccountIdx:{AccountIdx}] -");
            s.AppendFormat($"[ErrorCode:{ErrorCode}] - [ErrorMessage:{ErrorMessage}] - ");

            var jsonNode = JsonSerializer.SerializeToNode(this, GetType()).AsObject();
            jsonNode.Remove("ErrorCode");
            jsonNode.Remove("ErrorMessage");
            jsonNode.Remove("AccountIdx");

            s.Append(jsonNode.ToJsonString());

            return s.ToString();
        }
    }


    [DataContract]
    public abstract class BaseWebPacketForVID : BasePacket
    {
        [DataMember, PropertyDesc("밴더사로부터 받은 유저의 고유키")]
        public string VID { get; set; }

        [DataMember, PropertyDesc("밴더 종류")]
        public VenderType VenderType { get; set; }

        public override string GetUserKey()
        {
            return VID;
        }

        public sealed override string ToString()
        {
            StringBuilder s = new StringBuilder();

            s.AppendFormat($"[{GetType().Name}] - [VenderID:{VID}] - [VenderType:{VenderType}] - ");
            s.Append(JsonSerializer.Serialize(this, GetType()));

            return s.ToString();
        }
    }

    [DataContract]
    public abstract class BaseWebPacketForVIDResult : BasePacket, IErrorCode
    {
        [DataMember, PropertyDesc("공통 에러 코드")]
        public int ErrorCode { get; set; }

        [DataMember, PropertyDesc("세부 에러 메세지")]
        public string ErrorMessage { get; set; }

        [DataMember, PropertyDesc("VID")]
        public string VID { get; set; }

        #region 생성자
        public BaseWebPacketForVIDResult() { }
        public BaseWebPacketForVIDResult(string vid)
        {
            VID = vid;
            ErrorCode = 0;
            ErrorMessage = "SUCCESS";
        }
        #endregion

        public override string GetUserKey()
        {
            return VID;
        }

        public sealed override string ToString()
        {
            StringBuilder s = new StringBuilder();

            s.AppendFormat($"[{GetType().Name}] - [VID:{VID}] -");
            s.AppendFormat($"[ErrorCode:{ErrorCode}] - [ErrorMessage:{ErrorMessage}] - ");

            var jsonNode = JsonSerializer.SerializeToNode(this, GetType()).AsObject();
            jsonNode.Remove("ErrorCode");
            jsonNode.Remove("ErrorMessage");
            jsonNode.Remove("Version");

            s.Append(jsonNode.ToJsonString());

            return s.ToString();
        }
    }
}
