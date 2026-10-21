// Atlas person-index rows are current roster references, not sealed history.
export function projectActivePersonIndex(document, activeIds, activeRoutes) {
  if (!activeIds || document.slug !== 'World-Expansion-Index') return document;
  const result = structuredClone(document);
  const index = result.content.find(node => node.anchor === 'World-Expansion-Index-generated-page-additional-people-table-1');
  if (!index || index.kind !== 'table') throw Error('E_PERSON_INDEX_PROJECTION');
  index.rows = index.rows.filter(row => {
    const id = row[0]?.ko;
    if (typeof id !== 'string' || row[0]?.en !== id) throw Error('E_PERSON_INDEX_PROJECTION');
    if (/^K\d+$/u.test(id)) return activeIds.has(id);
    const route = row[1]?.ko?.match(/\]\((\/people\/person-\d{4})\)/u)?.[1];
    if (!route || !activeRoutes) throw Error('E_PERSON_INDEX_PROJECTION');
    return activeRoutes.has(route);
  });
  return result;
}

export function projectActiveRoster(production, dispositions, proseChanges = []) {
  const active = new Set([...dispositions].filter(([, row]) => row.status === 'active').map(([id]) => id));
  const all = new Set(production.personDetails.map(person => person.characterId));
  if (all.size !== dispositions.size || [...dispositions.keys()].some(id => !all.has(id)))
    throw Error('E_PERSON_DISPOSITION');
  const names = new Set(production.personDetails.filter(person => active.has(person.characterId)).map(person => person.name));
  const routes = new Set(production.personDetails.filter(person => active.has(person.characterId)).map(person => person.detailRoute));
  const tree = value => {
    if (!value) return value;
    const nodes = value.nodes.filter(node => !node.personId || active.has(node.personId));
    const ids = new Set(nodes.map(node => node.id));
    return { ...value, nodes, edges: value.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)) };
  };
  const currentProse = (value, sourcePath) => {
    if (typeof value === 'string') {
      for (const change of proseChanges) {
        if (change.path !== sourcePath || !change.pointer.includes('/ko')) continue;
        const before = change.before.trim(), after = change.after.trim();
        if (value.includes(before)) value = value.split(before).join(after);
      }
      return value;
    }
    if (Array.isArray(value)) return value.map(child => currentProse(child, sourcePath));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, currentProse(child, sourcePath)]));
    return value;
  };
  return {
    ...production,
    peopleCatalog: production.peopleCatalog.filter(person => names.has(person.name)),
    personDetails: production.personDetails.filter(person => active.has(person.characterId)).map(person => ({ ...person,
      biography: currentProse(person.biography, `lore/characters/${person.sourceRoute.split('/').at(-1).split('#')[0]}.json`),
      sections: currentProse(person.sections, `lore/characters/${person.sourceRoute.split('/').at(-1).split('#')[0]}.json`),
      fields: currentProse(person.fields, `lore/characters/${person.sourceRoute.split('/').at(-1).split('#')[0]}.json`),
      familyTree: tree(person.familyTree),
      proseContacts: person.proseContacts.filter(row => active.has(row.recipientId)),
      ...(person.court ? { court: { ...person.court, members: person.court.members.filter(row => active.has(row.personId)) } } : {}),
      relations: { outgoing: person.relations.outgoing.filter(row => names.has(row.to)),
        incoming: person.relations.incoming.filter(row => names.has(row.from)) },
    })),
    retainerGraph: { ...production.retainerGraph,
      nodes: production.retainerGraph.nodes.filter(row => active.has(row.id)),
      edges: production.retainerGraph.edges.filter(row => active.has(row.fromPersonId) && active.has(row.toPersonId)),
    },
    familyDetailRoutes: new Map([...production.familyDetailRoutes].filter(([id]) => active.has(id))),
    personFeedbackRecords: production.personFeedbackRecords.filter(row => routes.has(row.route)),
  };
}
