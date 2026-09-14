namespace SeoulKenshi.Contents.Station
{
    /// <summary>
    /// 역 시설 4종. 패킷 int 값과 동일하다.
    /// </summary>
    public enum FacilityKind
    {
        Supply = 1,      // 급양시설 — 식량
        Workshop = 2,    // 정비공장 — 부품
        Substation = 3,  // 변전소 — 전력
        Exchange = 4     // 교환소 — 교환권
    }
}
