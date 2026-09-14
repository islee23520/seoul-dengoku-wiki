using System;
using SeoulKenshi.Common.ErrorCode;

namespace SeoulKenshi.Common.Exception
{
    public partial class ErrorCodeException : ApplicationException
    {
        public string LogType { get; set; }
        public int ErrorCode = SystemErrorCode.SYSTEM_ERROR;

        public ErrorCodeException(int error)
        {
            ErrorCode = error;
        }

        public ErrorCodeException(string message)
            : base(message)
        {
        }

        public ErrorCodeException(int error, string message)
            : base(message)
        {
            ErrorCode = error;
        }

        public ErrorCodeException(string logType, string message)
            : base(message)
        {
            LogType = logType;
        }

        public ErrorCodeException(string logType, int error, string message)
            : base(message)
        {
            LogType = logType;
            ErrorCode = error;
        }
    }
}
