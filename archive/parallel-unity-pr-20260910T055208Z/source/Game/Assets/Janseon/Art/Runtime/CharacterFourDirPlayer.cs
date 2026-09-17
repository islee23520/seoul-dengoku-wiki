using UnityEngine;

namespace Janseon.Art
{
    [RequireComponent(typeof(SpriteRenderer))]
    public sealed class CharacterFourDirPlayer : MonoBehaviour
    {
        public const int CardinalFacings = 4;
        public const float LockedHeadsTall = 2.5f;
        public const float LockedTileFootprint = 1f;

        [SerializeField] string assetId = string.Empty;
        [SerializeField] string facing = "S";
        [SerializeField] string action = "idle";
        [SerializeField] float framesPerSecond = 12f;
        [SerializeField] float pixelsPerUnit = 85.333f;
        [SerializeField] float tileFootprint = LockedTileFootprint;
        [SerializeField] float headsTall = LockedHeadsTall;
        [SerializeField] SpriteRenderer spriteRenderer;
        [SerializeField] Sprite[] frames = System.Array.Empty<Sprite>();

        int index;
        float elapsed;
        Camera billboardCamera;
        Material runtimeMaterial;

        public string AssetId => assetId;
        public string Facing => facing;
        public string Action => action;
        public Sprite[] Frames => frames;
        public float PixelsPerUnit => pixelsPerUnit;
        public float TileFootprint => tileFootprint;
        public float HeadsTall => headsTall;

        public void Configure(
            string nextAssetId,
            string nextFacing,
            string nextAction,
            Sprite[] nextFrames,
            float nextPixelsPerUnit,
            float nextFootprint,
            float nextHeadsTall)
        {
            assetId = nextAssetId;
            pixelsPerUnit = nextPixelsPerUnit;
            tileFootprint = nextFootprint;
            headsTall = nextHeadsTall;
            Play(nextFacing, nextAction, nextFrames);
        }

        public void BindCamera(Camera camera)
        {
            billboardCamera = camera;
            BillboardToCamera();
        }

        public void Play(string nextFacing, string nextAction, Sprite[] nextFrames)
        {
            facing = nextFacing;
            action = nextAction;
            frames = nextFrames ?? System.Array.Empty<Sprite>();
            index = 0;
            elapsed = 0f;
            ApplyFrame();
            ApplyRuntimeMaterial();
            BillboardToCamera();
        }

        void Awake()
        {
            if (spriteRenderer == null)
            {
                spriteRenderer = GetComponent<SpriteRenderer>();
            }

            ApplyFrame();
        }

        void Update()
        {
            if (frames == null || frames.Length == 0 || framesPerSecond <= 0f)
            {
                return;
            }

            elapsed += Time.deltaTime;
            float step = 1f / framesPerSecond;
            while (elapsed >= step)
            {
                elapsed -= step;
                index = (index + 1) % frames.Length;
            }

            ApplyFrame();
        }

        void LateUpdate()
        {
            BillboardToCamera();
        }

        public void BillboardToCamera()
        {
            Camera target = billboardCamera != null ? billboardCamera : Camera.main;
            if (target == null)
            {
                return;
            }

            transform.rotation = target.transform.rotation;
        }

        void ApplyFrame()
        {
            if (spriteRenderer == null || frames == null || frames.Length == 0)
            {
                return;
            }

            spriteRenderer.sprite = frames[Mathf.Clamp(index, 0, frames.Length - 1)];
            spriteRenderer.drawMode = SpriteDrawMode.Simple;
            spriteRenderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            spriteRenderer.receiveShadows = false;
        }

        void ApplyRuntimeMaterial()
        {
            if (spriteRenderer == null)
            {
                return;
            }

            Shader shader = Shader.Find("Sprites/Default");
            if (shader == null)
            {
                return;
            }

            runtimeMaterial = new Material(shader);
            spriteRenderer.sharedMaterial = runtimeMaterial;
        }

        void OnDestroy()
        {
            if (runtimeMaterial != null)
            {
                Destroy(runtimeMaterial);
            }
        }
    }
}
