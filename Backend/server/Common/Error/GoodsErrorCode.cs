namespace SeoulKenshi.Common.ErrorCode
{
    public partial class GoodsErrorCode : SystemErrorCode
    {
        /// <summary>
        /// "에너지를 찾을 수 없습니다."
        /// </summary>
        public static readonly int ERROR_NOT_FOUND_ENERGY = 1001;

        /// <summary>
        /// "에너지 부족"
        /// </summary>
        public static readonly int ERROR_NOT_ENOUGHT_ENERGY = 1002;

        #region Goods 관련 에러는 1200번부터
        /// <summary>
        /// "골드 부족"
        /// </summary>
        public static readonly int ERROR_NOT_ENOUGHT_GOLD = 1201;

        /// <summary>
        /// "무료 캐시 부족"
        /// </summary>
        public static readonly int ERROR_NOT_ENOUGHT_FREE_CASH = 1202;

        /// <summary>
        /// "유료 캐시 부족"
        /// </summary>
        public static readonly int ERROR_NOT_ENOUGHT_PAID_CASH = 1203;

        /// <summary>
        /// "마일리지 부족"
        /// </summary>
        public static readonly int ERROR_NOT_ENOUGHT_MILEAGE = 1204;
        #endregion
    }
}
