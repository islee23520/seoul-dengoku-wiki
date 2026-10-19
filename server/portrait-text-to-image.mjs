// Composes text-to-image prompts from a portrait design token. Shared by the token
// generator (which stores the default views in each token) and the token API server.

export const textToImageModel = 'gpt-image-2.5'

export const textToImageViews = {
  portrait: { size: '1024x1536', camera: 'eye-level three-quarter medium close-up: full head, both shoulders and upper chest, no waist; head and torso turned slightly viewer-right; neutral still bust, shoulders level, no head tilt or gestures', fullBody: false },
  front: { size: '1024x1536', camera: 'full-body shot head to toe, exact front view, neutral standing pose, arms relaxed at the sides', fullBody: true },
  profile: { size: '1024x1536', camera: 'full-body shot head to toe, exact side profile facing viewer-right, neutral standing pose', fullBody: true },
  side: { size: '1024x1536', camera: 'full-body shot head to toe, oblique three-quarter side view, neutral standing pose', fullBody: true },
  back: { size: '1024x1536', camera: 'full-body shot head to toe, exact back view, neutral standing pose', fullBody: true },
}

export const textToImageStyles = {
  'yokoyama-b': 'Japanese historical manga illustration, anime manga style: 橫山光輝; firm ink linework, broad flat shadow planes, low-saturation muted colors; the same rendering rules for every cast member',
  'yoshikazu-yasuhiko': 'classic Japanese animation illustration referencing Yoshikazu Yasuhiko: flowing character contours, soft cel shading, gentle muted colors',
}

const negativePrompt = 'text, letters, captions, watermark, signature, logo, emblem, insignia, flags, weapons, firearms, blades, modern 21st-century fashion, sci-fi armor, background scenery, props on the ground, extra people, cropped head, extra fingers, deformed hands, distorted face'

const genderWord = { '남성': 'man', '여성': 'woman' }
const usable = (slot) => slot && typeof slot.value === 'string' && slot.value.trim() && !/^none\b/i.test(slot.value) ? slot.value.trim().replace(/[.;]+$/, '') : null

function ageWords(token) {
  const age = token.identity?.age
  const pronoun = token.facts.gender === '여성' ? 'her' : token.facts.gender === '남성' ? 'his' : 'their'
  if (token.identity?.ageCategory === 'minor') return 'in ' + pronoun + ' teens'
  if (typeof age !== 'number') return 'adult'
  if (age < 30) return 'in ' + pronoun + ' twenties'
  if (age < 40) return 'in ' + pronoun + ' thirties'
  if (age < 50) return 'in ' + pronoun + ' forties'
  if (age < 60) return 'in ' + pronoun + ' fifties'
  if (age < 70) return 'in ' + pronoun + ' sixties'
  return 'elderly'
}

export function composeTextToImage(token, view = 'portrait', style = 'yokoyama-b') {
  const camera = textToImageViews[view]
  if (!camera) throw new Error(`E_T2I_VIEW:${view}`)
  if (!textToImageStyles[style]) throw new Error(`E_T2I_STYLE:${style}`)
  const { face, hair, body, outfit, accessories } = token.slots
  const ethnicity = token.identity?.ethnicity?.value
  const subject = `${ethnicity && !/^unconfirmed/i.test(ethnicity) ? ethnicity : 'East Asian'} ${genderWord[token.facts.gender] ?? 'person'}, ${ageWords(token)}`
  const article = /^[aeiou]/i.test(subject) ? 'an' : 'a'
  const faceParts = [usable(face.description), usable(face.faceShape) && `face shape: ${usable(face.faceShape)}`, usable(face.eyeShape) && `${usable(face.eyeShape)} ${usable(face.eyeColor) ?? ''} eyes`.replace(/\s+/g, ' '), usable(face.eyebrowShape) && `${usable(face.eyebrowShape)} eyebrows`, usable(face.noseShape) && `nose: ${usable(face.noseShape)}`, usable(face.mouthShape) && `mouth: ${usable(face.mouthShape)}`, usable(face.lipColor) && `${usable(face.lipColor)} lips`, usable(face.beardShape) && `facial hair: ${usable(face.beardShape)}`]
  const hairParts = [usable(hair.description), usable(hair.color) && `${usable(hair.color)} hair`, usable(hair.length) && `${usable(hair.length)} length`]
  const bodyParts = [usable(body.build) && `build: ${usable(body.build)}`, usable(body.skin) && `skin: ${usable(body.skin)}`, camera.fullBody && typeof body.height?.value === 'number' ? `height ${body.height.value}${body.height.unit ?? ''}` : camera.fullBody && usable(body.height)]
  const outfitParts = [usable(outfit.headwear) && `headwear: ${usable(outfit.headwear)}`, usable(outfit.upper) && `upper garment: ${usable(outfit.upper)}`, usable(outfit.neckline) && `neckline: ${usable(outfit.neckline)}`, camera.fullBody && usable(outfit.lower) && `lower garment: ${usable(outfit.lower)}`, camera.fullBody && usable(outfit.footwear) && `footwear: ${usable(outfit.footwear)}`, usable(outfit.marks) && `marks: ${usable(outfit.marks)}`]
  const accessoryParts = [usable(accessories.description) && `accessories: ${usable(accessories.description)}`, usable(accessories.mounting) && `worn as ${usable(accessories.mounting)}`]
  const palette = token.artProposal?.palette?.length ? `color palette: ${token.artProposal.palette.join(', ')}` : null
  const sections = [
    `Character design sheet illustration of ${token.name}, ${article} ${subject}`,
    faceParts.filter(Boolean).join('; '),
    hairParts.filter(Boolean).join('; '),
    bodyParts.filter(Boolean).join('; '),
    outfitParts.filter(Boolean).join('; '),
    accessoryParts.filter(Boolean).join('; '),
    palette,
    'clothing silhouettes based on 1940s Second World War era civilian and work wear; calm restrained expression',
    camera.camera,
    textToImageStyles[style],
    'isolated figure on a fully transparent background, no scenery',
  ]
  return {
    schemaVersion: 1,
    personId: token.personId,
    characterId: token.characterId,
    approval: token.approval,
    view,
    style,
    model: textToImageModel,
    size: camera.size,
    background: 'transparent',
    outputFormat: 'png',
    styleReferenceSha256: token.style?.referenceSha256 ?? null,
    identityReferenceSha256: token.references?.identitySha256 ?? null,
    prompt: sections.filter(Boolean).join('. ') + '.',
    negativePrompt,
  }
}

export function textToImageBlock(token) {
  return {
    schemaVersion: 1,
    model: textToImageModel,
    defaultStyle: 'yokoyama-b',
    views: Object.fromEntries(Object.keys(textToImageViews).map((view) => {
      const { prompt, negativePrompt: negative, size } = composeTextToImage(token, view)
      return [view, { size, prompt, negativePrompt: negative }]
    })),
  }
}
