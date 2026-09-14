//using SeoulKenshi.Common;
//using SeoulKenshi.Common.Log;


//namespace SeoulKenshi.Contents.Reward
//{
//    public class EquipmentRewardResult : RewardResult
//    {
//        #region Properties
//        public Equipment Data { get; set; }
//        #endregion

//        #region 생성자         
//        public EquipmentRewardResult() : base(RewardType.Equipment) { }
//        public EquipmentRewardResult(GameLogCause cause, Equipment equipment)
//            : base(RewardType.Equipment, cause)
//        {
//            Data = equipment;
//        }
//        #endregion

//        public override string ToJson()
//        {
//            return Data.ToJson();
//        }
//    }
//}
