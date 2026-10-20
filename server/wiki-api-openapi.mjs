// OpenAPI 3.1 description of server/wiki-api.mjs, usable as an OpenAI tool/action schema.
const json = { 'application/json': { schema: { type: 'object' } } }
const ok = (description) => ({ 200: { description, content: json }, 404: { description: 'Not found', content: json } })
const query = (name, description, schema = { type: 'string' }) => ({ name, in: 'query', required: false, description, schema })
const path = (name, description) => ({ name, in: 'path', required: true, description, schema: { type: 'string' } })
const paging = [query('limit', 'Page size (1-2000, default 100)', { type: 'integer' }), query('offset', 'Rows to skip', { type: 'integer' })]
const collections = ['hegemons', 'states', 'regions', 'counties', 'stations', 'landmarks', 'vassals', 'titles', 'holdings', 'polities', 'retinues', 'openingDispositions']

export function openApiDocument(origin) {
  return {
    openapi: '3.1.0',
    info: {
      title: '서울:전국 wiki data API',
      version: '1.0.0',
      description: 'Read-only published wiki data for Seoul Subway States: people (characters), territories (states, dong regions, constituency counties, stations, landmarks, titles, holdings) and portrait design tokens with text-to-image prompts. Values marked derived:true in portrait tokens are unapproved art proposals.',
    },
    servers: [{ url: `${origin}/wiki/api` }],
    paths: {
      '/people': { get: { operationId: 'listPeople', summary: 'List or search characters', parameters: [query('q', 'Name, person ID or K character ID substring'), query('state', 'State ID such as S01'), query('tier', 'Common tier T1-T5'), query('gender', '남성 or 여성'), query('rank', 'Rank name'), query('hasPortrait', 'true or false'), ...paging], responses: ok('Paged character summaries') } },
      '/people/{personId}': { get: { operationId: 'getPerson', summary: 'Full published character record', parameters: [path('personId', 'person-XXXX or K character ID')], responses: ok('Character detail with sections, relations, values and links') } },
      '/people/{personId}/holdings': { get: { operationId: 'getPersonHoldings', summary: 'Titles, holdings and polities held by a character', parameters: [path('personId', 'person-XXXX or K character ID')], responses: ok('Holdings of the character') } },
      '/territories': { get: { operationId: 'getTerritoriesOverview', summary: 'Territory dataset overview, counts and collection links', responses: ok('Overview with published geographySource, spatialDate and currentDate; counties are geographic jurisdictions, titles are personal rights') } },
      '/territories/{collection}': { get: { operationId: 'listTerritories', summary: 'List a territory collection', parameters: [{ name: 'collection', in: 'path', required: true, schema: { type: 'string', enum: collections } }, query('q', 'Name or ID substring'), query('state', 'State ID filter'), query('district', 'Gu name filter such as 종로구'), query('rank', 'Title rank such as barony, county, duchy, kingdom'), query('holder', 'Holder K character ID'), query('geometry', 'Include SVG paths for regions and counties (true)'), ...paging], responses: ok('Paged territory rows') } },
      '/territories/{collection}/{id}': { get: { operationId: 'getTerritory', summary: 'One territory entry; states include their titles and holdings', parameters: [{ name: 'collection', in: 'path', required: true, schema: { type: 'string', enum: collections } }, path('id', 'Entry ID such as S01, region:1111051500 or title:kingdom-s06')], responses: ok('Territory entry') } },
      '/territories/scale': { get: { operationId: 'getTerritorialScale', summary: 'Territorial scale rules (barony, county, duchy, kingdom, empire)', responses: ok('Scale rules') } },
      '/territories/sources': { get: { operationId: 'getTerritorySources', summary: 'Published opening geography location, spatialDate/currentDate and map, population and landmark attribution', responses: ok('Source fields from opening-territories.json; no independent geography schema or edition is asserted') } },
      '/territories/lines': { get: { operationId: 'getRailLines', summary: 'Rail line names and colors', responses: ok('Lines') } },
      '/portrait-tokens': { get: { operationId: 'listPortraitTokens', summary: 'Portrait design token index', parameters: [query('q', 'Name or ID'), query('state', 'State ID')], responses: ok('Token index') } },
      '/portrait-tokens/{personId}': { get: { operationId: 'getPortraitToken', summary: 'Portrait design token of a character', parameters: [path('personId', 'person-XXXX')], responses: ok('Design token') } },
      '/portrait-tokens/{personId}/prompt': { get: { operationId: 'getPortraitPrompt', summary: 'Text-to-image prompt composed from the design token', parameters: [path('personId', 'person-XXXX'), query('view', 'portrait, front, profile, side or back'), query('style', 'yokoyama-b or yoshikazu-yasuhiko'), query('format', 'json (default) or text')], responses: ok('Prompt, negative prompt, model and size') } },
      '/health': { get: { operationId: 'getHealth', summary: 'Service health and loaded counts', responses: ok('Health') } },
    },
  }
}
