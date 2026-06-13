export const TEMPLATES = {
  meteor: {
    immediate: [
      'The sky split open above {settlement} and fire fell. {count} people burned.',
      'A light brighter than the sun struck the land. The survivors of {settlement} fled north.',
      'A mountain of fire fell on {settlement}. Where it landed, nothing grows even now.'
    ],
    legend: [
      'The priests of {settlement} say that {PLAYER_NAME} hurled a mountain of fire to punish {faction}\'s pride.',
      'The Screaming Sky Cult holds that the fire was a test. Those who fled failed. Those who burned were chosen.',
      'Mothers in {settlement} still hush children with the same warning: do not grow proud, or {PLAYER_NAME} will remember the fire.'
    ],
    religion: [
      '{Religion} was founded on the belief that {PLAYER_NAME} will send fire again when the people grow complacent.',
      'Every child in {settlement} is told: the sky has eyes. It has always had eyes.',
      'The fire-temples of {settlement} keep an ember burning at all times, so {PLAYER_NAME} need never strike twice.'
    ]
  },
  drought: {
    immediate: [
      'The rains stopped above the land. The rivers shrank to mud.',
      'Three harvests failed in {settlement}. The old ways of water-prayer were revived.',
      'The wells of {settlement} went dry in a single season. The elders said it was no accident.'
    ],
    legend: [
      'Elders say the drought came because the people of {settlement} angered {PLAYER_NAME} by building too close to the sky.',
      'The Water Keepers emerged after the Great Dry — priests who guard the last springs and speak to the above.',
      'They say {PLAYER_NAME} withheld the rain to teach {faction} the weight of every drop.'
    ],
    religion: [
      '{Religion} teaches that abundance is borrowed. {PLAYER_NAME} can recall it at any moment.',
      'They pour the first cup of every river into the ground — a gift returned to the one who gave it.',
      'In {settlement}, no one drinks before the sky is thanked. The Dry taught them that much.'
    ]
  },
  bless: {
    immediate: [
      'An unprecedented harvest filled every storehouse in {settlement}. No one went hungry.',
      'The fields of the land produced three times what they should. No explanation was found.',
      'For one impossible year, nothing in {settlement} died before its time.'
    ],
    legend: [
      'The Generous Hand touched our soil, say the elders. We do not know why we were chosen.',
      '{PLAYER_NAME} smiled on {settlement} that year. The people built a shrine at the edge of the fields.',
      'They still measure good years against that one, and call it the season {PLAYER_NAME} loved them.'
    ],
    religion: [
      'The Abundance Faith holds that {PLAYER_NAME} rewards stillness and gratitude, not ambition.',
      'They leave offerings at the field\'s edge each harvest — not to ask for more, but to say thank you.',
      '{Religion} teaches that {PLAYER_NAME} watches kindly, and that the proof was the year of plenty.'
    ]
  },

  // --- recurring / ambient feedsMyth event types (variety comes from CivEvents pools too) ---
  anomaly_detected: [
    'A philosopher in {settlement} has written: "The coincidences of nature are too precise. Someone arranged this."',
    'The new Containment School argues that our world has edges, walls, and a watcher outside them. They have been called heretics.',
    'An astronomer documented anomalies at the world\'s boundary. Her papers are being burned.'
  ],
  first_religion: [
    'A priest began speaking of the one who watches above. People listened.',
    'The first temple had no name for the watcher. They drew an eye above the door.'
  ],
  first_fire: [
    'In the beginning, there was fire. The stories say it came from above.',
    '{agent} stole fire from the sky, say the oldest songs. {PLAYER_NAME} let them take it.'
  ],
  first_war: [
    'The first blood between {factionA} and {factionB} is remembered as the War of {name}.',
    'The priests say the war was allowed by {PLAYER_NAME} to test which people were worthy.'
  ],
  guaranteed: [
    'The eldest among them tells the children: something made this world. We did not arrive here by accident.'
  ],

  // --- The Reckoning: the civilization discovers it is contained ---
  // Keyed by player archetype so the ending reacts to how you played.
  reckoning: {
    // Stage 1 — discovery (same for all; the realization lands)
    discovery: [
      'The mathematicians of {settlement} have proven it: the world has a boundary, and beyond the boundary, something observes. The proof cannot be refuted. It can only be lived with.',
      'A telescope at the edge of the world did not find more world. It found a watcher, looking back. The news is spreading faster than any law can stop it.'
    ],
    // Stage 2 + 3 — reaction, by archetype
    cruel: [
      'They know you now, {PLAYER_NAME}. They remember the fire. The temples preach that the watcher is cruel, and that survival means never being noticed. The cities have gone dark and quiet.',
      'A movement calls itself the Unseen. They tear down the spires, smother the lights, and teach their children to make no mark — so that {PLAYER_NAME} might forget they were ever here.'
    ],
    generous: [
      'They know you now, {PLAYER_NAME}. They remember the good years. The temples overflow. For the first time in their history, every settlement keeps the same feast on the same day — a thank-you, aimed upward.',
      'The people of {settlement} have written a message into their fields, vast enough to be read from outside the world: WE KNOW YOU ARE THERE. THANK YOU.'
    ],
    absent: [
      'They know now that something made this world. But it has never answered, never struck, never blessed. The philosophers of {settlement} conclude: the watcher does not care. Perhaps it has already looked away.',
      'A quiet faith spreads through {settlement}: that the watcher is gone, or sleeping, or was never watching at all. They stop praying. They were, they decide, always alone.'
    ],
    capricious: [
      'They know you now, {PLAYER_NAME} — and they cannot agree what you are. Half of {settlement} worships, half hides. The fire and the harvest came from the same hand, and that terrifies them more than any cruelty would.',
      'The scholars of {settlement} can find no pattern in what {PLAYER_NAME} has done. They build temples and bunkers side by side, and wait to learn which they will need.'
    ],
    redeemer: [
      'They know you now, {PLAYER_NAME}. You broke them, and then you mended them, and they have built a faith on exactly that: that suffering is followed by grace, if only they endure. They are not afraid.',
      'The Redeemed of {settlement} teach that the watcher tests and then restores. They face the boundary not with terror, but with a strange, hard-won peace.'
    ],
    // Stage 4 — the ending beat, by resolution
    transcend: [
      'And then, having understood everything, the people of {settlement} simply stopped. Not from war or famine — they had made their peace, and chose to go gently. The last of them looked up, once, and were still.',
      'The final generation did not collapse. They finished. Every story told, every question answered as far as it could be. They closed their eyes toward the boundary, and let the world go quiet.'
    ],
    collapse: [
      'The knowing was too much. The cities turned on themselves, the faiths went to war, and within a generation the great civilization that had reached the edge of its world was gone. The last words, scratched into a wall in {settlement}: WE SAW YOU.',
      'They could not live with being watched. The towers came down, the lights went out one by one, and the world they had built unraveled faster than it had ever grown.'
    ]
  }
}
