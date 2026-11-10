---
model: hand-written by cpa/claude-opus-5-5 (st_01a1c7b2; 0 completion draft calls; hand-edited lines: targeted string replacements of conflicting sentences, rest kept verbatim)
section_checkpoint: complete
---

Bon-gwan identified a lineage within a surname, while hangnyeol was a rule marking generations from the founder with one character in names within the same clan. Surname, bon-gwan, branch, family line, generation count, and hangnyeol character were separate fields. People with the same surname were not necessarily from the same family, and people of the same age did not necessarily belong to the same generation.

## Examples of Family Hangnyeol

In 2126, Yi Hong-won belongs to the Gyeongju Yi clan, Jeong Seoon to the Jinyang Jeong clan, and Choe Ji-u to the Changnyeong Choe clan.

1. Yi Hong-won: Gyeongju Yi clan
2. Jeong Seoon: Jinyang Jeong clan
3. Choe Ji-u: Changnyeong Choe clan

| Item | Confirmed value | Interpretation |
|---|---|---|
| Total surnames surveyed | 5,582 | Included naturalized and non-Hanja spellings |
| Surnames representable in Hanja | 1,507 | The same Hangul spelling could represent separate lineages when the Hanja differed |
| Surnames without Hanja | 4,075 | Reflected a large increase in modern naturalized and foreign-origin spellings |
| Surnames by bon-gwan | 36,744 | Increased from 4,179 in 2000 |
| Hanja-surname rows copied into this repository | 512 | Rows listed in the table with a population of at least five |
| Major bon-gwan listed in the table | 408 | Only bon-gwan accounting for a majority of each surname's population were listed |
| Surname rows with a blank major bon-gwan field | 263 | This did not mean there was no bon-gwan; no majority bon-gwan existed or the table did not list it |

The bon-gwan identities actually used by the cast were organized into 169 clans: 166 based on historical material and three created for the setting. Public research did not confirm historical bon-gwan for Ran and Heung, so the clans newly agreed upon after the collapse were the created Dobong Ran clan and Susaek Heung clan, respectively. They were not claimed to be historical bon-gwan, and no sources were attached.

## Cast Application Results

The clan register listed all 1,022 people on the cast roster; 1,017 of them had bon-gwan and clan IDs. No bon-gwan, clan, or hangnyeol was recorded for Go Ye-jin, Han Seo-gyeong, Cha Yu-seon, and Mun Do-hyeon.

Bon-gwan and clan IDs were present for **1,017 people**. Na, Ra, Ryu, Mun, and Min, whose surnames had no major bon-gwan in the census table, were supplemented from separate historical clan material; Ran and Heung, whose historical bon-gwan could not be confirmed, were assigned the created clans above. Im Somae, Beom Bandeuk, Amira Qasim, and Nargiz Yusupova opened new naturalized bon-gwan named after the places where they settled. I Yeon, a synthetic humanoid, has no paternal line and so no bon-gwan. Completing bon-gwan assignment and confirming hangnyeol were different things.

| Status | People | Meaning |
|---|---|---|
| `applied` | 3 | Two names matched the derived generation of a created branch; one matched a documented clan hangnyeol table |
| `inferred` | 516 | Families of one clan that share a character in the same name position agreed on a new hangnyeol after the collapse. They are the first generation of that agreed table |
| `free` | 447 | Families that named their children without a hangnyeol, because no other household in the clan shares a name character |
| `unused` | 51 | The name does not use the hangnyeol: it is a single-character name or does not contain the existing generation character |
| `no-bongwan` | 1 | No paternal line, so no bon-gwan, clan, or hangnyeol |

The applied examples were Seong Suhyeon and Seong Sa-hyeon of the Changnyeong Seong Train-Maintenance Branch. They were children of the same parent, Seong Dowon; the count was Founder Seong Changrip, generation 40 → Seong Dowon, generation 41 → the two children, generation 42. This branch was a **created family line** newly agreed upon after the collapse and referred to the five-element generating cycle. It was not claimed to be a historical Changnyeong Seong hangnyeol table. Their existing names were not changed; the second character `hyeon` remained as it was.

The bon-gwan and generational elements of the three people above were these: Yi Hong-won was Gyeongju Yi, Water; Jeong Seoon was Jinyang Jeong, Metal; and Choe Ji-u was Changnyeong Choe, Fire. These elements were the hangnyeol rules for the opening generation; the characters `hong`, `seo`, and `ji` were not retrospectively identified as hangnyeol characters.

## Sources

- [Encyclopedia of Korean Culture: Bon-gwan](https://encykorea.aks.ac.kr/Article/E0023741)
- [Wikipedia: Jokbo](https://ko.wikipedia.org/wiki/jokbo)
- [Wikipedia: Korean surnames](https://ko.wikipedia.org/wiki/hangugui_seongssi)
- [Wikipedia: Hangnyeol](https://ko.wikipedia.org/wiki/hangnyeol)
