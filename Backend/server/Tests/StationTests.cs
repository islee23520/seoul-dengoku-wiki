using SeoulKenshi.Contents.Station;
using SeoulKenshi.DB.Station;
using SeoulKenshi.Protocols.WCF.Station;

namespace SeoulKenshi.Server.Tests;

public class StationTests
{
    private static readonly DateTime T0 = new DateTime(2026, 9, 14, 0, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void ApplyTick_one_hour_increases_each_resource_by_base_times_level()
    {
        var state = StationState.CreateDefault(1, T0);
        StationEconomy.ApplyTick(state, T0.AddHours(1));

        Assert.Equal(30, state.Food);
        Assert.Equal(30, state.Parts);
        Assert.Equal(30, state.Energy);
        Assert.Equal(30, state.Vouchers);
        Assert.Equal(T0.AddHours(1), state.LastUpdated);
    }

    [Fact]
    public void ApplyTick_scales_production_by_facility_level()
    {
        var state = StationState.CreateDefault(1, T0);
        state.SupplyLevel = 2;
        state.WorkshopLevel = 3;
        state.SubstationLevel = 4;
        state.ExchangeLevel = 5;

        StationEconomy.ApplyTick(state, T0.AddHours(2));

        Assert.Equal(30 * 2 * 2, state.Food);
        Assert.Equal(30 * 3 * 2, state.Parts);
        Assert.Equal(30 * 4 * 2, state.Energy);
        Assert.Equal(30 * 5 * 2, state.Vouchers);
    }

    [Fact]
    public void ApplyTick_zero_elapsed_does_not_change_resources_or_timestamp()
    {
        var state = StationState.CreateDefault(1, T0);
        state.Food = 10;
        StationEconomy.ApplyTick(state, T0);

        Assert.Equal(10, state.Food);
        Assert.Equal(0, state.Parts);
        Assert.Equal(T0, state.LastUpdated);
    }

    [Fact]
    public void ApplyTick_negative_elapsed_does_not_produce_or_rewind_timestamp()
    {
        var state = StationState.CreateDefault(1, T0);
        state.Food = 10;
        StationEconomy.ApplyTick(state, T0.AddHours(-3));

        Assert.Equal(10, state.Food);
        Assert.Equal(0, state.Parts);
        Assert.Equal(T0, state.LastUpdated);
    }

    [Fact]
    public void ApplyTick_clamps_to_storage_cap()
    {
        var state = StationState.CreateDefault(1, T0);
        state.Food = 490;
        StationEconomy.ApplyTick(state, T0.AddHours(1));

        Assert.Equal(StationEconomy.StorageCap(1), state.Food);
        Assert.Equal(30, state.Parts);
    }

    [Fact]
    public void ApplyTick_over_cap_clamps_down_even_with_zero_elapsed()
    {
        var state = StationState.CreateDefault(1, T0);
        state.Food = 10_000;
        state.Parts = 501;
        state.Energy = 500;
        state.Vouchers = -3;

        StationEconomy.ApplyTick(state, T0);

        Assert.Equal(500, state.Food);
        Assert.Equal(500, state.Parts);
        Assert.Equal(500, state.Energy);
        Assert.Equal(0, state.Vouchers);
        Assert.Equal(T0, state.LastUpdated);
    }

    [Fact]
    public void ApplyTick_over_cap_does_not_accrue_further()
    {
        var state = StationState.CreateDefault(1, T0);
        state.Food = 800;
        StationEconomy.ApplyTick(state, T0.AddHours(10));

        Assert.Equal(500, state.Food);
        Assert.Equal(T0.AddHours(10), state.LastUpdated);
    }

    [Fact]
    public void StorageCap_scales_with_level()
    {
        Assert.Equal(0, StationEconomy.StorageCap(0));
        Assert.Equal(500, StationEconomy.StorageCap(1));
        Assert.Equal(2500, StationEconomy.StorageCap(5));
        Assert.Equal(60, StationEconomy.ProductionPerHour(2));
    }

    [Theory]
    [InlineData(1, 100, 80, 40, 60)]
    [InlineData(5, 655, 524, 262, 304)]
    [InlineData(10, 6872, 5498, 2749, 2307)]
    public void Construction_cost_and_duration_curve(int level, long food, long parts, long energy, int seconds)
    {
        var cost = ConstructionQueue.CostFor(level);
        Assert.Equal(food, cost.Food);
        Assert.Equal(parts, cost.Parts);
        Assert.Equal(energy, cost.Energy);
        Assert.Equal(0, cost.Vouchers);
        Assert.Equal(seconds, ConstructionQueue.DurationSecondsFor(level));
    }

    [Fact]
    public void Queue_rejects_second_job_and_completes_lazily_at_read_time()
    {
        var queue = new ConstructionQueue();
        var state = StationState.CreateDefault(1, T0);

        Assert.True(queue.TryStart(FacilityKind.Supply, 2, T0));
        Assert.False(queue.TryStart(FacilityKind.Workshop, 2, T0));
        Assert.True(queue.HasJob);
        Assert.Equal(FacilityKind.Supply, queue.Current.FacilityKind);

        var duration = ConstructionQueue.DurationSecondsFor(2);
        Assert.Equal(90, duration);

        Assert.False(queue.IsCompleted(T0));
        Assert.False(queue.IsCompleted(T0.AddSeconds(duration - 1)));
        Assert.False(queue.Complete(state, T0.AddSeconds(duration - 1)));
        Assert.Equal(1, state.SupplyLevel);

        Assert.True(queue.IsCompleted(T0.AddSeconds(duration)));
        Assert.True(queue.Complete(state, T0.AddSeconds(duration)));
        Assert.Equal(2, state.SupplyLevel);
        Assert.False(queue.HasJob);
        Assert.False(queue.IsCompleted(T0.AddHours(1)));
        Assert.False(queue.Complete(T0.AddHours(1)));
    }

    [Fact]
    public void Queue_complete_without_state_clears_slot_at_boundary()
    {
        var queue = new ConstructionQueue();
        Assert.True(queue.TryStart(FacilityKind.Exchange, 1, T0));
        Assert.True(queue.IsCompleted(T0.AddSeconds(60)));
        Assert.True(queue.Complete(T0.AddSeconds(60)));
        Assert.Null(queue.Current);
    }

    [Fact]
    public void Packet_and_repository_types_match_station_contract()
    {
        var get = new ReqGetStationResult(7)
        {
            Station = new StationPacket { Food = 1, SupplyLevel = 1 },
            Construction = new ConstructionPacket { FacilityKind = (int)FacilityKind.Supply, TargetLevel = 2 }
        };
        Assert.Equal(7, get.AccountIdx);
        Assert.Equal(0, get.ErrorCode);

        var start = new ReqStartConstruction { FacilityKind = (int)FacilityKind.Workshop, TargetLevel = 3 };
        Assert.Equal(2, start.FacilityKind);

        var complete = new ReqCompleteConstructionResult(7);
        Assert.Equal(7, complete.AccountIdx);

        var repo = new StationRepository();
        Assert.NotNull(repo);
        Assert.Equal("tbl_station", TableName<StationEntity>());
        Assert.Equal("tbl_station_construction", TableName<StationConstructionEntity>());
    }

    private static string TableName<T>()
    {
        var attr = (Dapper.Contrib.Extensions.TableAttribute)Attribute.GetCustomAttribute(
            typeof(T), typeof(Dapper.Contrib.Extensions.TableAttribute))!;
        return attr.Name;
    }
}
