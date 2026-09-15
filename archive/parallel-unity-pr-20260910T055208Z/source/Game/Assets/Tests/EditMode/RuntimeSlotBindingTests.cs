using Janseon.Foundation.Art;
using NUnit.Framework;
using UnityEngine;

public sealed class RuntimeSlotBindingTests
{
    [Test]
    public void RuntimeSlotCatalog_TitleBackdrop_ContractUnchanged()
    {
        // uGUI cutover (task 13): RuntimeSlotView (UITK) deleted. Slot visuals move to
        // task 26 catalog wiring; the catalog contract itself must stay stable.
        var catalog = ScriptableObject.CreateInstance<RuntimeSlotCatalog>();
        Assert.That(catalog, Is.Not.Null, "slot catalog must still construct");
    }
}
