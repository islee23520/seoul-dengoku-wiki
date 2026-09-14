namespace SeoulKenshi.Contents.Inventory
{
    /// <summary>
    /// 슬롯 기반 인벤토리의 공통 인터페이스.
    /// Hero/Equipment/Item 인벤토리가 구현합니다.
    /// </summary>
    public interface IInventory
    {
        short MaxSlotCount { get; set; }
        int Count { get; }
        bool IsEnoughSlot(short addableCount);
    }
}
