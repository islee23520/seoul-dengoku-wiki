namespace SeoulKenshi.Common.ErrorCode
{
    public partial class SessionErrorCode : SystemErrorCode
    {
        /// <summary>
        /// "호스트가 이미 열어둔 세션이 있다."
        /// </summary>
        public static readonly int ERROR_SESSION_HOST_ALREADY_HOSTING = 4001;

        /// <summary>
        /// "세션 코드와 맞는 열린 세션이 없다."
        /// </summary>
        public static readonly int ERROR_SESSION_NOT_FOUND = 4002;

        /// <summary>
        /// "세션 정원이 가득 찼다."
        /// </summary>
        public static readonly int ERROR_SESSION_FULL = 4003;

        /// <summary>
        /// "이미 세션 구성원이다."
        /// </summary>
        public static readonly int ERROR_SESSION_ALREADY_MEMBER = 4004;

        /// <summary>
        /// "호스트가 아니면 세션을 닫을 수 없다."
        /// </summary>
        public static readonly int ERROR_SESSION_NOT_HOST = 4005;

        /// <summary>
        /// "세션이 이미 닫혔다."
        /// </summary>
        public static readonly int ERROR_SESSION_CLOSED = 4006;
    }
}
