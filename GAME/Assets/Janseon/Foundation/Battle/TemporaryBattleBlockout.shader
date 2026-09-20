Shader "Janseon/TemporaryBattleBlockout"
{
    Properties
    {
        _BaseColor ("Base Color", Color) = (1,1,1,1)
        _Color ("Color", Color) = (1,1,1,1)
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry" }
        Pass
        {
            ZWrite On
            Cull Back
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct Attributes { float4 vertex : POSITION; };
            struct Varyings { float4 position : SV_POSITION; };
            float4 _BaseColor;

            Varyings vert(Attributes input)
            {
                Varyings output;
                output.position = UnityObjectToClipPos(input.vertex);
                return output;
            }

            half4 frag(Varyings input) : SV_Target
            {
                return half4(_BaseColor.rgb, 1);
            }
            ENDHLSL
        }
    }
    Fallback Off
}
