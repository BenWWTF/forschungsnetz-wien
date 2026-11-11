/* All visitor-facing wording, German and English. {placeholders} are filled from the data,
   so the texts stay true when the dataset is rebuilt. */
export const STRINGS = {
  de: {
    docTitle: 'Wer forscht mit wem in Wien? Ein Netz in 3D',
    title: 'Wer forscht mit wem in Wien?',
    subtitle: '{places} Forschungsorte, {pairs} Verbindungen. Tippe auf eine Kugel, oder halte sie fest und zieh daran.',
    viewLabel: 'Ansicht', viewNet: 'Netz', viewCity: 'Stadtplan', legendLabel: 'Legende',
    pause: 'Bewegung anhalten', play: 'Bewegung fortsetzen', home: 'Überblick', tourShort: 'So geht’s',
    hint: 'Tippe auf eine Kugel, oder halte sie fest und zieh', crowd: 'Hier liegen mehrere Orte dicht beisammen. Näher ran!',
    idleNote: 'Noch da? Tippe irgendwo, sonst beginnt alles in {s} Sekunden von vorn.',
    eggLabel: 'Etwas Verstecktes', eggFound: 'Gefunden! {n} von {all}', eggAll: 'Du hast alles Versteckte gefunden.', eggLast: 'Das letzte Versteck',
    eggNext: 'Alles gefunden? Fast. Gerade ist noch etwas aufgetaucht: Sieh bei „{place}“ nach.',
    eggNextQ: 'Ein allerletztes Versteck gibt es noch. Es liegt dort, wo das Q. ist. Schau in den Stadtplan.',
    eggNextHere: 'Ein allerletztes Versteck gibt es noch. Es liegt genau dort, wo du gerade stehst. Schau in den Stadtplan.',
    eggHintQ: 'Psst: Schau im Stadtplan beim Q. nach.',
    eggCount: 'Verstecktes gefunden: {n} von {all}', eggRow: 'Psst, du hast etwas Verstecktes gefunden', eggHint: 'Psst: Sieh dir „{place}“ einmal ganz aus der Nähe an.',
    search: 'Ort suchen', noMatch: 'Kein Ort mit diesem Namen.',
    noData: 'Die Daten konnten nicht geladen werden. Bitte lade die Seite neu.',
    keyBall: 'Größe: Zahl der Veröffentlichungen', keyLine: 'Linie: gemeinsam veröffentlicht', keyRing: 'Kleine Bögen: ohne Wiener Partner veröffentlicht',
    tourStart: 'So liest du das Netz', listOpen: 'Alle Orte', listShort: 'Orte', aboutOpen: 'Über das Netz', aboutShort: 'Info',
    back: 'Zurück', next: 'Weiter', tourDone: 'Selbst erkunden', tourClose: 'Beenden', close: 'Schließen', step: 'Schritt {i} von {n}',
    topics: ['Technik, Physik & Mathematik', 'Lebewesen & Natur', 'Gesundheit & Medizin', 'Mensch & Gesellschaft'],
    kind: { uni: 'Universität', inst: 'Forschungsinstitut', klinik: 'Krankenhaus', museum: 'Museum', fh: 'Hochschule', amt: 'Öffentliche Forschungsstelle' },
    short: 'Im Netz steht:', members: 'Dazu gehören:',
    heroUnit: 'Veröffentlichungen seit {since}',
    band: ['{places} Forschungsorte', '{pairs} Verbindungen', '{total} Veröffentlichungen seit {since}', 'Rund {week} neue Veröffentlichungen pro Woche', 'Forschung ist Teamarbeit'],
    togetherTitle: 'Allein oder gemeinsam?',
    togetherNote: '{n} davon ({pct} %) sind gemeinsam mit einem anderen Wiener Forschungsort entstanden.',
    ringNote: 'Für die anderen {n} stehen die kleinen Bögen, die zur Kugel zurückführen.',
    topicsTitle: 'Woran wird hier geforscht?',
    partnersTitle: 'Forscht am häufigsten gemeinsam mit',
    partnersNote: 'Die Zahl zeigt die gemeinsamen Veröffentlichungen. Insgesamt hat dieser Ort {n} Partner im Netz.',
    listTitle: 'Alle {places} Forschungsorte', listNote: 'Geordnet nach der Zahl der Veröffentlichungen seit {since}.',
    noWebgl: 'Dieses Gerät kann die 3D-Ansicht leider nicht darstellen.',
  },
  en: {
    docTitle: 'Who does research with whom in Vienna? A network in 3D',
    title: 'Who does research with whom in Vienna?',
    subtitle: '{places} research places, {pairs} connections. Tap a sphere, or hold it and pull.',
    viewLabel: 'View', viewNet: 'Network', viewCity: 'City map', legendLabel: 'Legend',
    pause: 'Pause motion', play: 'Resume motion', home: 'Overview', tourShort: 'How to',
    hint: 'Tap a sphere, or hold it and pull', crowd: 'Several places sit close together here. Moving in!',
    idleNote: 'Still there? Tap anywhere, or everything starts over in {s} seconds.',
    eggLabel: 'Something hidden', eggFound: 'Found! {n} of {all}', eggAll: 'You have found everything that was hidden.', eggLast: 'The last hiding place',
    eggNext: 'Found everything? Almost. Something else has just turned up: look at “{place}”.',
    eggNextQ: 'There is one very last hiding place. It is where the Q. is. Look at the city map.',
    eggNextHere: 'There is one very last hiding place. It is right where you are standing. Look at the city map.',
    eggHintQ: 'Psst: look at the Q. on the city map.',
    eggCount: 'Hidden things found: {n} of {all}', eggRow: 'Psst, you have found something hidden', eggHint: 'Psst: take a really close look at “{place}”.',
    search: 'Find a place', noMatch: 'No place with this name.',
    noData: 'The data could not be loaded. Please reload the page.',
    keyBall: 'Size: number of publications', keyLine: 'Line: published together', keyRing: 'Small arcs: published without a Vienna partner',
    tourStart: 'How to read the network', listOpen: 'All places', listShort: 'Places', aboutOpen: 'About', aboutShort: 'Info',
    back: 'Back', next: 'Next', tourDone: 'Explore yourself', tourClose: 'End', close: 'Close', step: 'Step {i} of {n}',
    topics: ['Technology, physics & maths', 'Living things & nature', 'Health & medicine', 'People & society'],
    kind: { uni: 'University', inst: 'Research institute', klinik: 'Hospital', museum: 'Museum', fh: 'College', amt: 'Public research agency' },
    short: 'Label in the network:', members: 'Includes:',
    heroUnit: 'Publications since {since}',
    band: ['{places} research places', '{pairs} connections', '{total} publications since {since}', 'About {week} new publications a week', 'Research is teamwork'],
    togetherTitle: 'Alone or together?',
    togetherNote: '{n} of them ({pct} %) were written together with another research place in Vienna.',
    ringNote: 'The small arcs that fall back to the sphere stand for the other {n}.',
    topicsTitle: 'What do they research here?',
    partnersTitle: 'Publishes most often with',
    partnersNote: 'The number counts joint publications. This place has {n} partners in the network.',
    listTitle: 'All {places} research places', listNote: 'Ordered by the number of publications since {since}.',
    noWebgl: 'Sorry, this device cannot show the 3D view.',
  },
};

/* Easter eggs: a small object next to a sphere, visible once a visitor comes close. Every card
   tells one true story. Stage 2 appears when all of stage 1 is found, stage 3 after that. `keys` are words that reveal the egg when typed into the search. */
const svg = body => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
export const EGGS = [
  { id: 'scissors', stage: 1, node: 'Vienna BioCenter', keys: ['schere', 'crispr', 'scissors', 'charpentier', 'gen'],
    icon: svg('<circle cx="13" cy="41" r="5"/><circle cx="35" cy="41" r="5"/><path d="M16 37 31 20M32 37 17 20"/><g stroke-width="1.7"><path d="M3 4c7 0 7 11 14 11S24 4 31 4s7 11 14 11"/><path d="M3 15c7 0 7-11 14-11s7 11 14 11S38 4 45 4"/><path d="M7.5 6.5v6M12.5 6.5v6M35.5 6.5v6M40.5 6.5v6"/></g>'),
    de: { title: 'Die Genschere', text: ['Emmanuelle Charpentier forschte von 2002 bis 2009 in Wien, an den Max Perutz Labs. Hier fand ihr Team einen wichtigen Baustein der Genschere CRISPR. Mit ihr lässt sich Erbgut ganz gezielt schneiden.', '2020 bekam sie dafür den Nobelpreis für Chemie, gemeinsam mit Jennifer Doudna.'] },
    en: { title: 'The gene scissors', text: ['Emmanuelle Charpentier did research in Vienna from 2002 to 2009, at the Max Perutz Labs. Here her team found a key part of the gene scissors CRISPR, a tool that cuts genetic material at exactly the chosen spot.', 'In 2020 she received the Nobel Prize in Chemistry for it, together with Jennifer Doudna.'] } },
  { id: 'clock', stage: 1, node: 'TU Wien', keys: ['uhr', 'atomuhr', 'kernuhr', 'clock', 'schumm', 'thorium'],
    icon: svg('<circle cx="24" cy="26" r="13"/><path d="M24 18v8l5 4"/><ellipse cx="24" cy="26" rx="21" ry="7" transform="rotate(-28 24 26)" stroke-width="1.8"/><path d="M20 9h8M24 9v4"/>'),
    de: { title: 'Die Uhr im Atomkern', text: ['Thorsten Schumm und sein Team an der TU Wien bauen an einer Uhr, die mit Atomkernen tickt. 2024 gelang es ihnen gemeinsam mit Forschenden aus Braunschweig zum ersten Mal, den Kern eines Thorium-Atoms mit einem Laser gezielt anzuregen.', 'Eine solche Kernuhr könnte einmal noch genauer gehen als die besten Atomuhren von heute.'] },
    en: { title: 'The clock inside the atom', text: ['Thorsten Schumm and his team at TU Wien are building a clock that ticks with atomic nuclei. In 2024, together with researchers from Braunschweig, they were the first to excite the nucleus of a thorium atom with a laser on purpose.', 'A nuclear clock like this could one day be even more precise than today’s best atomic clocks.'] } },
  { id: 'bulb', stage: 2, node: 'TU Wien', keys: ['glühbirne', 'lindorfer', 'smart', 'iot', 'spion', 'sicherheit', 'bulb', 'security'],
    icon: svg('<path d="M17 30c-4-3-6-7-6-12a13 13 0 0 1 26 0c0 5-2 9-6 12v5H17z"/><path d="M19 40h10M21 44h6"/><circle cx="24" cy="17" r="3.2"/><path d="M24 20.5v6"/>'),
    de: { title: 'Die neugierige Glühbirne', text: ['Türschlösser und Glühbirnen hängen heute oft am Internet. Aber was erzählen sie dort über uns, und wer kann sich einschleichen? Martina Lindorfer und ihr Team an der TU Wien haben das von 2020 bis 2025 untersucht.', 'Der Trick: Sie nahmen die Apps unter die Lupe, mit denen man solche Geräte steuert. So lassen sich Sicherheitslücken finden, ohne jedes Gerät selbst kaufen zu müssen. Gefördert hat das Projekt der WWTF.'] },
    en: { title: 'The nosy light bulb', text: ['Door locks and light bulbs are often online these days. But what do they tell the internet about us, and who can sneak in? Martina Lindorfer and her team at TU Wien studied this from 2020 to 2025.', 'The trick: they examined the apps that control such devices. That way security holes can be found without buying every single device. The project was funded by WWTF.'] } },
  { id: 'slug', stage: 1, node: 'MedUni Wien', keys: ['schnecke', 'kandel', 'slug', 'snail', 'gedächtnis', 'memory'],
    icon: svg('<path d="M5 35c2-9 9-14 17-11 6 2 9 2 13-2 3-3 7-2 8 2 1 5-3 11-10 11H5z"/><path d="M36 21l-2-9M41 22l3-8"/><circle cx="34" cy="11" r="1.4" fill="currentColor" stroke="none"/><circle cx="44" cy="13" r="1.4" fill="currentColor" stroke="none"/><path d="M12 30c3-2 6-2 9 0"/>'),
    de: { title: 'Die Meeresschnecke', text: ['Eric Kandel wurde 1929 in Wien geboren und musste als Kind vor den Nationalsozialisten fliehen. In den USA fand er an einer Meeresschnecke heraus, was im Gehirn passiert, wenn wir uns etwas merken. Dafür bekam er im Jahr 2000 den Nobelpreis für Medizin.', 'Die Schnecke sitzt bei der MedUni Wien, weil auch dort am Gehirn geforscht wird.'] },
    en: { title: 'The sea slug', text: ['Eric Kandel was born in Vienna in 1929 and had to flee from the Nazis as a child. In the USA he used a sea slug to find out what happens in the brain when we remember something. For this he received the Nobel Prize in Medicine in 2000.', 'The slug sits next to MedUni Wien because the brain is studied there too.'] } },
  { id: 'marshmallow', stage: 1, node: 'Universität Wien', keys: ['marshmallow', 'mischel', 'geduld', 'warten'],
    icon: svg('<rect x="13" y="6" width="22" height="20" rx="7"/><path d="M24 26v17"/><path d="M18 13c2-2 5-2 7 0"/><path d="M35 14c-3 0-5 2-5 5" stroke-width="1.8"/>'),
    de: { title: 'Der Marshmallow', text: ['Ein Marshmallow sofort, oder zwei, wenn du warten kannst? Diesen berühmten Test erfand der Psychologe Walter Mischel in den 1960er-Jahren in den USA. Er wurde 1930 in Wien geboren und musste 1938 fliehen.', 'Achtung, Verwechslungsgefahr: Der Marshmallow gehört zu Mischel, die Meeresschnecke zu Eric Kandel. Auch sie ist hier irgendwo versteckt.'] },
    en: { title: 'The marshmallow', text: ['One marshmallow now, or two if you can wait? The psychologist Walter Mischel invented this famous test in the 1960s in the USA. He was born in Vienna in 1930 and had to flee in 1938.', 'Easy to mix up: the marshmallow belongs to Mischel, the sea slug to Eric Kandel. That one is hidden here somewhere too.'] } },
  { id: 'question', stage: 3, at: 'q', keys: [],
    icon: svg('<path d="M16 17c0-5 3.5-9 8.5-9S33 11.5 33 16c0 6-8.5 6.500-8.5 13"/><circle cx="24.5" cy="38" r="1.8" fill="currentColor"/>'),
    de: { title: 'Und deine Frage?', text: ['Geschafft, du hast alle Verstecke gefunden. Die Genschere, die Kernuhr, die Meeresschnecke, der Marshmallow und die neugierige Glühbirne haben eines gemeinsam: Am Anfang stand jedes Mal eine Frage.', 'Jede Kugel in diesem Netz steht für Menschen, die etwas wissen wollten. Was möchtest du herausfinden?'] },
    en: { title: 'And your question?', text: ['Well done, you have found every hiding place. The gene scissors, the nuclear clock, the sea slug, the marshmallow and the nosy light bulb have one thing in common: each began with a question.', 'Every sphere in this network stands for people who wanted to know something. What would you like to find out?'] } },
];

/* The tour teaches how to read the picture before anyone explores it. `show` sets the scene. */
export const TOUR = [
  { show: 'all',
    de: { title: 'Das ist Wiens Forschungsnetz', body: ['Jede Kugel ist ein Ort, an dem geforscht wird: eine Universität, ein Krankenhaus, ein Museum oder ein Forschungsinstitut. Hier siehst du {places} davon.'] },
    en: { title: 'This is Vienna\'s research network', body: ['Every sphere is a place where people do research: a university, a hospital, a museum or a research institute. You can see {places} of them here.'] } },
  { show: 'biggest',
    de: { title: 'Große Kugel, viele Veröffentlichungen', body: ['Wer etwas Neues herausfindet, schreibt es auf, damit andere es nachlesen und überprüfen können. Das nennt man eine Veröffentlichung.', 'Je mehr Veröffentlichungen ein Ort seit {since} hat, desto größer ist seine Kugel. Die größte gehört zu „{big}“: {bigCount}.'] },
    en: { title: 'Big sphere, many publications', body: ['When researchers find out something new, they write it down so that others can read and check it. That is called a publication.', 'The more publications a place has had since {since}, the bigger its sphere. The biggest one belongs to “{big}”: {bigCount}.'] } },
  { show: 'pair',
    de: { title: 'Eine Linie heißt: gemeinsam geforscht', body: ['Forschung ist Teamarbeit. Eine Linie verbindet zwei Orte, wenn Menschen von beiden zusammen etwas veröffentlicht haben. Je dicker und heller die Linie, desto öfter. Kleine Bögen, die zur selben Kugel zurückführen, stehen für das, was ein Ort ohne Wiener Partner veröffentlicht hat: je mehr Bögen, desto mehr.', 'Die dickste Linie verbindet „{pairA}“ und „{pairB}“: {pairCount} gemeinsame Veröffentlichungen.', 'Probier es später aus: Halte eine Kugel fest und zieh daran. Die verbundenen Orte bewegen sich mit, und ein großer Ort zieht stärker als ein kleiner.'] },
    en: { title: 'A line means: researched together', body: ['Research is teamwork. A line joins two places when people from both have published something together. The thicker and brighter the line, the more often. Small arcs that fall back to the same sphere stand for what a place has published without a partner in Vienna: the more arcs, the more.', 'The thickest line joins “{pairA}” and “{pairB}”: {pairCount} joint publications.', 'Try it later: hold a sphere and pull. The connected places move along, and a big place pulls harder than a small one.'] } },
  { show: 'topics',
    de: { title: 'Die Farbe zeigt das Thema', body: ['Jede Kugel hat die Farbe des Themas, zu dem dort am meisten veröffentlicht wird. Viele Orte forschen aber an mehreren Themen. Tippe später auf eine Kugel, dann siehst du die ganze Mischung.'] },
    en: { title: 'Colour shows the topic', body: ['Each sphere has the colour of the topic it publishes on most. Many places work on several topics, though. Tap a sphere later to see the whole mix.'] } },
  { show: 'city',
    de: { title: 'Wo ist das in Wien?', body: ['Jetzt schwebt jede Kugel über ihrer Adresse, und die Linien spannen sich als Bögen über die Stadt. Die Zahlen sind die Bezirke, das blaue Band ist die Donau.', 'Findest du einen Forschungsort in deiner Nähe?'] },
    en: { title: 'Where is that in Vienna?', body: ['Now every sphere floats above its address, and the lines arch across the city. The numbers are the districts, the blue band is the Danube.', 'Can you find a research place near you?'] } },
  { show: 'all',
    de: { title: 'Was das Netz nicht zeigt', body: ['Jede Grafik lässt etwas weg. Hier fehlen alle Partner außerhalb Wiens, obwohl Forschende mit der ganzen Welt zusammenarbeiten. Gezählt wird erst seit {since}.', 'Und eine große Kugel heißt nicht „besser“. Sie zeigt nur, dass dort viel veröffentlicht wird. Frag bei jeder Grafik: Was wurde gezählt, und was nicht?'] },
    en: { title: 'What the network does not show', body: ['Every chart leaves something out. This one leaves out all partners outside Vienna, although researchers work with people all over the world. Counting only starts in {since}.', 'And a big sphere does not mean “better”. It only shows that a lot gets published there. With any chart, ask: what was counted, and what was not?'] } },
];

export function aboutHtml(lang, f) {
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  const radar = link('https://research.wwtf.at/collaboration.html', 'Vienna Research Radar');
  if (lang === 'de') return `<h2>Über das Netz</h2>
    <p>Ein Prototyp für eine Ausstellung über Wissenschaft, gestaltet im Erscheinungsbild des Q., aber kein offizielles Angebot des Q. Der Prototyp zeigt, welche Wiener Forschungsorte gemeinsam veröffentlichen, und will nebenbei üben, wie man eine Datengrafik liest.</p>
    <h3>Die Daten</h3>
    <p>${f.total} Veröffentlichungen von ${f.since} bis ${f.to} aus dem ${radar} des WWTF, das wöchentlich aus OpenAlex gespeist wird. ${f.joint} davon (${f.share} %) haben Autorinnen und Autoren an zwei oder mehr Wiener Forschungsorten.</p>
    <h3>Die Regeln</h3>
    <ul><li>Eine Linie zählt nur, wenn zwei verschiedene Menschen an den beiden Orten arbeiten. Eine Person mit zwei Arbeitgebern ist keine Zusammenarbeit.</li>
    <li>Das Volumen einer Kugel wächst mit der Zahl der Veröffentlichungen, die Dicke einer Linie mit der Zahl der gemeinsamen.</li>
    <li>Die kleinen Bögen an einer Kugel zeigen, wie viel ein Ort ohne anderen Wiener Forschungsort veröffentlicht hat: ein bis sieben Bögen, in logarithmischen Stufen. Partner außerhalb Wiens können trotzdem beteiligt sein.</li>
    <li>Die wandernden Lichtpunkte auf den Linien sind Schmuck und zeigen keine Daten.</li>
    <li>Zieht man an einer Kugel, bewegen sich die verbundenen Orte mit: stärker entlang dicker Linien, und ein großer Ort zieht einen kleinen stärker mit als umgekehrt. Das ist ein Bild dafür, dass Veränderungen an einem Ort die anderen erreichen. Gemessen ist diese Wirkung nicht.</li>
    <li>Dachorganisationen sind zu einer Kugel zusammengefasst und stehen im Stadtplan an ihrem Hauptsitz.</li>
    <li>Im Netz sitzen alle Orte auf der Oberfläche einer Kugel, eng verbundene näher beisammen. Die Lage hat sonst keine Bedeutung.</li></ul>
    <h3>Quellen</h3>
    <p>Forschungsdaten: ${radar} (WWTF), ${link('https://openalex.org', 'OpenAlex')}. Bezirksgrenzen und Gewässer: ${link('https://data.wien.gv.at', 'Stadt Wien, data.wien.gv.at')} (CC BY 4.0). Adressen verortet mit Daten von ${link('https://www.openstreetmap.org/copyright', '© OpenStreetMap-Mitwirkenden')}.</p>`;
  return `<h2>About the network</h2>
    <p>A prototype for an exhibition about science, designed in the look of the Q. but not an official product of the Q. The prototype shows which research places in Vienna publish together, and it practises how to read a data graphic along the way.</p>
    <h3>The data</h3>
    <p>${f.total} publications from ${f.since} to ${f.to}, taken from WWTF's ${radar}, which is fed weekly from OpenAlex. ${f.joint} of them (${f.share} %) have authors at two or more research places in Vienna.</p>
    <h3>The rules</h3>
    <ul><li>A line only counts when two different people work at the two places. One person with two employers is not a collaboration.</li>
    <li>The volume of a sphere grows with the number of publications, the thickness of a line with the number of joint ones.</li>
    <li>The small arcs on a sphere show how much a place has published without another research place in Vienna: one to seven arcs, in logarithmic steps. Partners outside Vienna may still be involved.</li>
    <li>The travelling lights on the lines are decoration and carry no data.</li>
    <li>Pull a sphere and the connected places move along: more along thick lines, and a big place pulls a small one more than the other way round. It is a picture of how change in one place reaches the others. This effect is not measured.</li>
    <li>Umbrella organisations are merged into one sphere and sit at their head office on the city map.</li>
    <li>In the network, all places sit on the surface of a sphere, closely linked ones nearer to each other. Position has no other meaning.</li></ul>
    <h3>Sources</h3>
    <p>Research data: ${radar} (WWTF), ${link('https://openalex.org', 'OpenAlex')}. District borders and waters: ${link('https://data.wien.gv.at', 'City of Vienna, data.wien.gv.at')} (CC BY 4.0). Addresses located with data from ${link('https://www.openstreetmap.org/copyright', '© OpenStreetMap contributors')}.</p>`;
}
