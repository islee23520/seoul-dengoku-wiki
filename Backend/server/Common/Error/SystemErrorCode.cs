using Y2K.Core.Web.WCF.HelpPage.Description;

namespace SeoulKenshi.Common.ErrorCode
{
    [ErrorCode]
    [HelpPage]
    public partial class SystemErrorCode
    {
        [ErrorDesc("성공")]
        public static readonly int SUCCESS = 0;

        [ErrorDesc("시스템 관련 에러")]
        public static readonly int SYSTEM_ERROR = 1;

        [ErrorDesc("DB 처리중 발생한 에러")]
        public static readonly int SYSTEM_DB_QUERY_ERROR = 2;

        [ErrorDesc("ICRUD 인터페이스 내에서 정의되지 않는 DB 명령어가 수행되었을 떄 발생함.")]
        public static readonly int SYSTEM_INVALID_DB_OPERATION = 3;

        [ErrorDesc("입력 파라메터값 오류")]
        public static readonly int SYSTEM_INVALID_ARGUMENT = 4;

        [ErrorDesc("switch-case문 내에서 형식 지정이 되지 않은 형태가 있을 경우에 대한 오류")]
        public static readonly int SYSTEM_INVALID_TYPE = 5;

        [ErrorDesc("일부 구현되지 않은 기능에 대한 에러코드")]
        public static readonly int SYSTEM_NOT_IMPLEMENTED_CLASS = 7;

        [ErrorDesc("High버전값이 맞지 않을 경우")]
        public static readonly int SYSTEM_MISMACH_VERSION_HEIGHT = 8;

        [ErrorDesc("Middle버전값이 맞지 않을 경우")]
        public static readonly int SYSTEM_MISMACH_VERSION_MIDDLE = 9;

        [ErrorDesc("Low버전값이 맞지 않을 경우")]
        public static readonly int SYSTEM_MISMACH_VERSION_LOW = 10;

        [ErrorDesc("기획 데이터가 존재하지 않는다.(정확한 내용은 서버 로그 및 ErroCodeMessage에서 확인 가능)")]
        public static readonly int SYSTEM_NOT_FOUND_SPEC_DATA = 11;

        #region 패킷 관련 시스템 에러(100 ~ 199)
        [ErrorDesc("이미 처리된 패킷")]
        public static readonly int SYSTEM_PROCESSED_PACKET = 100;

        [ErrorDesc("로그인 세션이 없거나 세션이 잘못된 경우")]
        public static readonly int SYSTEM_INVALID_SESSION_KEY = 101;

        [ErrorDesc("패킷이 처리중입니다.")]
        public static readonly int SYSTEM_IN_PROCESSING = 102;

        [ErrorDesc("패킷에 포함된 필수 정보가 없을때 발생하는 에러코드, accountIdx, VID등이 없을때 발생")]
        public static readonly int SYSTEM_INVALID_PACKET_DATA = 103;

        [ErrorDesc("Live 서버에서 허용되지 않은 클라이언트IP로 Api가 호출 되었을 때 발생")]
        public static readonly int SYSTEM_UNACCEPTABLE_PACKET = 199;
        #endregion

        [ErrorDesc("사용할 수 없는 단어가 포함되어 있다.")]
        public static readonly int SYSTEM_IGNORE_WORD = 201;

        [ErrorDesc("이미 존재하는 닉네임")]
        public static readonly int ERROR_ALREADY_EXIST_NICKNAME = 202;


        [ErrorDesc("유저 데이터를 찾을 수 없습니다.(정확한 내용은 서버 로그 및 ErrorCodeMessage에서 확인 가능)")]
        public static readonly int SYSTEM_NOT_FOUND_USER_DATA = 999;
    }
}
