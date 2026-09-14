using SeoulKenshi.Contents.Social;
using SeoulKenshi.Protocols.WCF.Social;

namespace SeoulKenshi.Server.Tests;

public class SocialTests
{
    [Fact]
    public void EventLog_Sorts_Chronologically_And_Returns_Recent_N()
    {
        var log = new EventLog();
        var t1 = new DateTime(2026, 1, 1, 0, 0, 1, DateTimeKind.Utc);
        var t2 = new DateTime(2026, 1, 1, 0, 0, 2, DateTimeKind.Utc);
        var t3 = new DateTime(2026, 1, 1, 0, 0, 3, DateTimeKind.Utc);
        var t4 = new DateTime(2026, 1, 1, 0, 0, 4, DateTimeKind.Utc);

        log.Add(new EventLogEntry(t3, "C", "third"));
        log.Add(new EventLogEntry(t1, "A", "first"));
        log.Add(new EventLogEntry(t4, "D", "fourth"));
        log.Add(new EventLogEntry(t2, "B", "second"));

        var recent = log.GetRecent(3);

        Assert.Equal(3, recent.Count);
        Assert.Equal(new[] { "B", "C", "D" }, recent.Select(e => e.Type).ToArray());
        Assert.True(recent[0].OccurredAt < recent[1].OccurredAt);
        Assert.True(recent[1].OccurredAt < recent[2].OccurredAt);
    }

    [Fact]
    public void EventLog_Recent_Zero_Is_Empty_And_Oversize_Returns_All_Sorted()
    {
        var t1 = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc);
        var t2 = new DateTime(2026, 2, 1, 0, 0, 1, DateTimeKind.Utc);
        var entries = new[]
        {
            new EventLogEntry(t2, "late", "b"),
            new EventLogEntry(t1, "early", "a"),
        };

        Assert.Empty(EventLogEntry.TakeRecent(entries, 0));

        var all = EventLogEntry.TakeRecent(entries, 10);
        Assert.Equal(2, all.Count);
        Assert.Equal("early", all[0].Type);
        Assert.Equal("late", all[1].Type);
    }

    [Fact]
    public void RankingScore_Is_TotalResources_Plus_FacilityLevels_Times_Weight()
    {
        var score = new RankingScore(accountIdx: 10, totalResources: 250, facilityLevelSum: 4);

        Assert.Equal(250 + 4 * RankingScore.FacilityLevelWeight, score.Value);
        Assert.Equal(RankingScore.Calculate(250, 4), score.Value);
        Assert.Equal(100, RankingScore.FacilityLevelWeight);
    }

    [Fact]
    public void RankingScore_Ties_Share_Rank_Then_Skip()
    {
        var a = new RankingScore(3, totalResources: 100, facilityLevelSum: 2);
        var b = new RankingScore(1, totalResources: 100, facilityLevelSum: 2);
        var c = new RankingScore(2, totalResources: 0, facilityLevelSum: 1);

        Assert.Equal(a.Value, b.Value);
        Assert.True(c.Value < a.Value);

        var placed = RankingScore.Place(new[] { a, b, c });

        Assert.Equal(3, placed.Count);
        Assert.Equal(1, placed[0].Score.AccountIdx);
        Assert.Equal(1, placed[0].Rank);
        Assert.Equal(3, placed[1].Score.AccountIdx);
        Assert.Equal(1, placed[1].Rank);
        Assert.Equal(2, placed[2].Score.AccountIdx);
        Assert.Equal(3, placed[2].Rank);
    }

    [Fact]
    public void Alliance_Create_Rejects_Duplicate_Name()
    {
        var registry = new AllianceRegistry();
        registry.Create("수문동맹", 1);

        Assert.Throws<InvalidOperationException>(() => registry.Create("수문동맹", 2));
        Assert.Throws<InvalidOperationException>(() => registry.Create(" 수문동맹 ", 3));

        registry.Create("Gate", 4);
        Assert.Throws<InvalidOperationException>(() => registry.Create("gate", 5));
        Assert.Throws<ArgumentException>(() => registry.Create("   ", 6));
        Assert.Throws<ArgumentNullException>(() => registry.Create(null!, 7));
    }

    [Fact]
    public void Alliance_Join_And_Leave()
    {
        var registry = new AllianceRegistry();
        var alliance = registry.Create("제작동맹", 10);

        Assert.Equal(new long[] { 10 }, alliance.Members.ToArray());

        registry.Join("제작동맹", 20);
        Assert.Equal(new long[] { 10, 20 }, alliance.Members.ToArray());

        alliance.Leave(20);
        Assert.Equal(new long[] { 10 }, alliance.Members.ToArray());

        alliance.Join(20);
        Assert.Contains(20L, alliance.Members);
    }

    [Fact]
    public void Social_Packets_Expose_Event_Ranking_Alliance_Contracts()
    {
        var events = new ReqGetEventLog { AccountIdx = 1, Count = 5 };
        var ranking = new ReqGetRanking { AccountIdx = 1, Count = 10 };
        var create = new ReqCreateAlliance { AccountIdx = 1, Name = "수문동맹" };
        var join = new ReqJoinAlliance { AccountIdx = 2, Name = "수문동맹" };

        Assert.Equal(5, events.Count);
        Assert.Equal(10, ranking.Count);
        Assert.Equal("수문동맹", create.Name);
        Assert.Equal("수문동맹", join.Name);
        Assert.NotNull(new ReqGetEventLogResult(1).Events);
        Assert.NotNull(new ReqGetRankingResult(1).Rankings);
        Assert.NotNull(new AlliancePacket().Members);
    }
}
