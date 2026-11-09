/* All visitor-facing wording, German and English. {placeholders} are filled from the data,
   so the texts stay true when the dataset is rebuilt. */
export const STRINGS = {
  de: {
    docTitle: 'Wer forscht mit wem in Wien? Ein Netz in 3D',
    title: 'Wer forscht mit wem in Wien?',
    subtitle: '{places} Forschungsorte, {pairs} Verbindungen. Dreh das Netz und tippe auf eine Kugel.',
    viewLabel: 'Ansicht', viewNet: 'Netz', viewCity: 'Stadtplan', langLabel: 'Sprache wechseln', legendLabel: 'Legende',
    keyBall: 'Größe: Zahl der Veröffentlichungen', keyLine: 'Linie: gemeinsam veröffentlicht',
    tourStart: 'So liest du das Netz', listOpen: 'Alle Orte', aboutOpen: 'Über das Netz',
    back: 'Zurück', next: 'Weiter', tourDone: 'Selbst erkunden', tourClose: 'Beenden', close: 'Schließen', step: 'Schritt {i} von {n}',
    topics: ['Technik, Physik & Mathematik', 'Lebewesen & Natur', 'Gesundheit & Medizin', 'Mensch & Gesellschaft'],
    kind: { uni: 'Universität', inst: 'Forschungsinstitut', klinik: 'Krankenhaus', museum: 'Museum', fh: 'Hochschule', amt: 'Öffentliche Forschungsstelle' },
    short: 'Im Netz steht:', members: 'Dazu gehören:',
    heroUnit: 'Veröffentlichungen seit {since}',
    togetherTitle: 'Allein oder gemeinsam?',
    togetherNote: '{n} davon ({pct} %) sind gemeinsam mit einem anderen Wiener Forschungsort entstanden.',
    topicsTitle: 'Woran wird hier geforscht?',
    partnersTitle: 'Forscht am häufigsten gemeinsam mit',
    partnersNote: 'Die Zahl zeigt die gemeinsamen Veröffentlichungen. Insgesamt hat dieser Ort {n} Partner im Netz.',
    listTitle: 'Alle {places} Forschungsorte', listNote: 'Geordnet nach der Zahl der Veröffentlichungen seit {since}.',
    noWebgl: 'Dieses Gerät kann die 3D-Ansicht leider nicht darstellen.',
  },
  en: {
    docTitle: 'Who does research with whom in Vienna? A network in 3D',
    title: 'Who does research with whom in Vienna?',
    subtitle: '{places} research places, {pairs} connections. Spin the network and tap a sphere.',
    viewLabel: 'View', viewNet: 'Network', viewCity: 'City map', langLabel: 'Switch language', legendLabel: 'Legend',
    keyBall: 'Size: number of publications', keyLine: 'Line: published together',
    tourStart: 'How to read the network', listOpen: 'All places', aboutOpen: 'About',
    back: 'Back', next: 'Next', tourDone: 'Explore yourself', tourClose: 'End', close: 'Close', step: 'Step {i} of {n}',
    topics: ['Technology, physics & maths', 'Living things & nature', 'Health & medicine', 'People & society'],
    kind: { uni: 'University', inst: 'Research institute', klinik: 'Hospital', museum: 'Museum', fh: 'College', amt: 'Public research agency' },
    short: 'Label in the network:', members: 'Includes:',
    heroUnit: 'publications since {since}',
    togetherTitle: 'Alone or together?',
    togetherNote: '{n} of them ({pct} %) were written together with another research place in Vienna.',
    topicsTitle: 'What do they research here?',
    partnersTitle: 'Publishes most often with',
    partnersNote: 'The number counts joint publications. This place has {n} partners in the network.',
    listTitle: 'All {places} research places', listNote: 'Ordered by the number of publications since {since}.',
    noWebgl: 'Sorry, this device cannot show the 3D view.',
  },
};

/* The tour teaches how to read the picture before anyone explores it. `show` sets the scene. */
export const TOUR = [
  { show: 'all',
    de: { title: 'Das ist Wiens Forschungsnetz', body: ['Jede Kugel ist ein Ort, an dem geforscht wird: eine Universität, ein Krankenhaus, ein Museum oder ein Forschungsinstitut. Hier siehst du {places} davon.'] },
    en: { title: 'This is Vienna\'s research network', body: ['Every sphere is a place where people do research: a university, a hospital, a museum or a research institute. You can see {places} of them here.'] } },
  { show: 'biggest',
    de: { title: 'Große Kugel, viele Veröffentlichungen', body: ['Wer etwas Neues herausfindet, schreibt es auf, damit andere es nachlesen und überprüfen können. Das nennt man eine Veröffentlichung.', 'Je mehr Veröffentlichungen ein Ort seit {since} hat, desto größer ist seine Kugel. Die größte gehört zu „{big}“: {bigCount}.'] },
    en: { title: 'Big sphere, many publications', body: ['When researchers find out something new, they write it down so that others can read and check it. That is called a publication.', 'The more publications a place has had since {since}, the bigger its sphere. The biggest one belongs to “{big}”: {bigCount}.'] } },
  { show: 'pair',
    de: { title: 'Eine Linie heißt: gemeinsam geforscht', body: ['Forschung ist Teamarbeit. Eine Linie verbindet zwei Orte, wenn Menschen von beiden zusammen etwas veröffentlicht haben. Je dicker und heller die Linie, desto öfter.', 'Die dickste Linie verbindet „{pairA}“ und „{pairB}“: {pairCount} gemeinsame Veröffentlichungen.'] },
    en: { title: 'A line means: researched together', body: ['Research is teamwork. A line joins two places when people from both have published something together. The thicker and brighter the line, the more often.', 'The thickest line joins “{pairA}” and “{pairB}”: {pairCount} joint publications.'] } },
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
    <p>Ein Prototyp für eine Ausstellung über Wissenschaft, gestaltet im Erscheinungsbild des Q, aber kein offizielles Angebot des Q. Er zeigt, welche Wiener Forschungsorte gemeinsam veröffentlichen, und will nebenbei üben, wie man eine Datengrafik liest.</p>
    <h3>Die Daten</h3>
    <p>${f.total} Veröffentlichungen von ${f.since} bis ${f.to} aus dem ${radar} des WWTF, das wöchentlich aus OpenAlex gespeist wird. ${f.joint} davon (${f.share} %) haben Autorinnen und Autoren an zwei oder mehr Wiener Forschungsorten.</p>
    <h3>Die Regeln</h3>
    <ul><li>Eine Linie zählt nur, wenn zwei verschiedene Menschen an den beiden Orten arbeiten. Eine Person mit zwei Arbeitgebern ist keine Zusammenarbeit.</li>
    <li>Das Volumen einer Kugel wächst mit der Zahl der Veröffentlichungen, die Dicke einer Linie mit der Zahl der gemeinsamen.</li>
    <li>Dachorganisationen sind zu einer Kugel zusammengefasst und stehen im Stadtplan an ihrem Hauptsitz.</li>
    <li>Im Netz sitzen alle Orte auf der Oberfläche einer Kugel, eng verbundene näher beisammen. Die Lage hat sonst keine Bedeutung.</li></ul>
    <h3>Quellen</h3>
    <p>Forschungsdaten: ${radar} (WWTF), ${link('https://openalex.org', 'OpenAlex')}. Bezirksgrenzen und Gewässer: ${link('https://data.wien.gv.at', 'Stadt Wien, data.wien.gv.at')} (CC BY 4.0). Adressen verortet mit Daten von ${link('https://www.openstreetmap.org/copyright', '© OpenStreetMap-Mitwirkenden')}.</p>`;
  return `<h2>About the network</h2>
    <p>A prototype for an exhibition about science, designed in the look of the Q but not an official Q product. It shows which research places in Vienna publish together, and it practises how to read a data graphic along the way.</p>
    <h3>The data</h3>
    <p>${f.total} publications from ${f.since} to ${f.to}, taken from WWTF's ${radar}, which is fed weekly from OpenAlex. ${f.joint} of them (${f.share} %) have authors at two or more research places in Vienna.</p>
    <h3>The rules</h3>
    <ul><li>A line only counts when two different people work at the two places. One person with two employers is not a collaboration.</li>
    <li>The volume of a sphere grows with the number of publications, the thickness of a line with the number of joint ones.</li>
    <li>Umbrella organisations are merged into one sphere and sit at their head office on the city map.</li>
    <li>In the network, all places sit on the surface of a sphere, closely linked ones nearer to each other. Position has no other meaning.</li></ul>
    <h3>Sources</h3>
    <p>Research data: ${radar} (WWTF), ${link('https://openalex.org', 'OpenAlex')}. District borders and waters: ${link('https://data.wien.gv.at', 'City of Vienna, data.wien.gv.at')} (CC BY 4.0). Addresses located with data from ${link('https://www.openstreetmap.org/copyright', '© OpenStreetMap contributors')}.</p>`;
}
