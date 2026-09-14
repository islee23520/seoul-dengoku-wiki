namespace SeoulKenshi.Server.Tests;

public class SmokeTest
{
    [Fact]
    public void Common_GlobalRandom_Is_Renamed_To_SeoulKenshi()
    {
        Assert.NotNull(typeof(SeoulKenshi.Common.GlobalRandom));
    }
}
