namespace Janseon.Foundation.UI
{
    /// <summary>
    /// Exactly one uGUI screen surface may attach per active content-screen lease.
    /// </summary>
    public sealed class UiScreenDocumentLease
    {
        public const int MaxDocumentsPerLease = 1;

        string attachedId;

        public int AttachedCount => string.IsNullOrEmpty(attachedId) ? 0 : 1;

        public bool TryAttach(string documentId)
        {
            if (string.IsNullOrEmpty(documentId))
            {
                return false;
            }

            if (!string.IsNullOrEmpty(attachedId))
            {
                return false;
            }

            attachedId = documentId;
            return true;
        }

        public void Detach()
        {
            attachedId = null;
        }
    }
}
