export type Verb = { base: string; preterit: string; participle: string; fr: string };

const raw = `be|was|been|être
beat|beat|beaten|battre
become|became|become|devenir
begin|began|begun|commencer
bet|bet|bet|parier
blow|blew|blown|souffler
break|broke|broken|casser
bring|brought|brought|apporter
build|built|built|construire
burn|burnt|burnt|brûler
burst|burst|burst|éclater, exploser
buy|bought|bought|acheter
catch|caught|caught|attraper
choose|chose|chosen|choisir
come|came|come|venir
cost|cost|cost|coûter
cut|cut|cut|couper
do|did|done|faire
draw|drew|drawn|dessiner, tirer
drink|drank|drunk|boire
drive|drove|driven|conduire
eat|ate|eaten|manger
fall|fell|fallen|tomber
feed|fed|fed|(se) nourrir
feel|felt|felt|sentir, ressentir
fight|fought|fought|(se) battre
find|found|found|trouver
fly|flew|flown|voler
forget|forgot|forgotten|oublier
get|got|got|obtenir, devenir
give|gave|given|donner
go|went|gone|aller
grow|grew|grown|grandir, faire pousser
have|had|had|avoir
hear|heard|heard|entendre
hide|hid|hidden|(se) cacher
hit|hit|hit|frapper
hold|held|held|tenir
keep|kept|kept|garder
know|knew|known|connaître, savoir
leave|left|left|laisser, partir
lose|lost|lost|perdre
make|made|made|faire, fabriquer
mean|meant|meant|signifier
meet|met|met|rencontrer
pay|paid|paid|payer
put|put|put|mettre, poser
read|read|read|lire
ride|rode|ridden|aller à cheval, à bicyclette
run|ran|run|courir
say|said|said|dire
see|saw|seen|voir
sell|sold|sold|vendre
send|sent|sent|envoyer
shake|shook|shaken|trembler
shine|shone|shone|briller
show|showed|shown|montrer
sing|sang|sung|chanter
sleep|slept|slept|dormir
smell|smelt|smelt|sentir (une odeur)
speak|spoke|spoken|parler
spend|spent|spent|dépenser, passer du temps
stand|stood|stood|être debout
steal|stole|stolen|voler, dérober
swim|swam|swum|nager
take|took|taken|prendre
teach|taught|taught|enseigner
tear|tore|torn|déchirer
tell|told|told|dire
think|thought|thought|penser
understand|understood|understood|comprendre
wake (up)|woke|woken|se réveiller
wear|wore|worn|porter (vêtement)
win|won|won|gagner
write|wrote|written|écrire`;

export const VERBS: Verb[] = raw.split("\n").map((l) => {
  const [base = "", preterit = "", participle = "", fr = ""] = l.split("|");
  return { base, preterit, participle, fr };
});
