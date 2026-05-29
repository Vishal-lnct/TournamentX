const sportTone = {
  cricket: "ball-by-ball drama, partnerships, run rate pressure",
  football: "pressing patterns, chances created, late-match momentum",
  kabaddi: "raid pressure, defensive holds, bonus-line timing",
  volleyball: "service runs, blocks, rotation matchups",
  badminton: "rally rhythm, stamina, net play",
  basketball: "transition pace, shot quality, bench impact",
  hockey: "circle entries, penalty corners, tempo shifts",
  custom: "key moments, score swings, team discipline",
};

const modelProfiles = {
  gpt: "GPT-4.1 style: balanced, polished, suitable for public announcements.",
  gemini: "Gemini style: structured, fast planning and operational checklists.",
  claude: "Claude style: careful, calm, useful for policies and long-form notes.",
};

export function formatCurrency(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "Rs. 0";
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

export function getTournamentHealth(tournament) {
  const capacity = Number(tournament.number_of_teams || 0);
  const approved = Number(tournament.approved_registrations_count || 0);
  const total = Number(tournament.total_registrations_count || approved || 0);
  const fillRate = capacity ? Math.round((approved / capacity) * 100) : 0;
  const waitlist = Math.max(total - approved, 0);
  const slotsLeft = Math.max(capacity - approved, 0);

  let label = "Needs push";
  let tone = "warning";
  if (fillRate >= 85) {
    label = "Almost full";
    tone = "hot";
  } else if (fillRate >= 55) {
    label = "Healthy";
    tone = "good";
  }

  return { fillRate, waitlist, slotsLeft, label, tone };
}

export function buildScoreProjection(tournament) {
  const sport = tournament.sport || "custom";
  const approved = Number(tournament.approved_registrations_count || 0);
  const format = tournament.match_format || "League";
  const seed = `${tournament.name}${tournament.location}${format}`.length;
  const home = 42 + ((seed + approved * 7) % 58);
  const away = 38 + ((seed * 3 + approved * 5) % 54);

  if (sport === "cricket") {
    const overs = format === "T10" ? "10" : format === "ODI" ? "50" : "20";
    return `${home + 84}/${3 + (seed % 5)} vs ${away + 78}/${4 + (seed % 4)} after ${overs} overs`;
  }
  if (sport === "football" || sport === "hockey") {
    return `${home % 5} - ${(away + 1) % 4} projected final`;
  }
  if (sport === "basketball") {
    return `${home + 22} - ${away + 18} projected final`;
  }
  if (sport === "volleyball" || sport === "badminton") {
    return `${2 + (seed % 2)} - ${1 + (approved % 2)} sets projected`;
  }
  if (sport === "kabaddi") {
    return `${home} - ${away} projected final`;
  }
  return `${home} - ${away} projected contest score`;
}

export function buildCommentary(tournament, model = "gpt") {
  const health = getTournamentHealth(tournament);
  const style = sportTone[tournament.sport] || sportTone.custom;
  const modelLine = modelProfiles[model] || modelProfiles.gpt;

  return {
    title: `${tournament.name} live desk`,
    modelLine,
    prompt: [
      "Role: senior sports commentator and tournament operations assistant.",
      `Sport context: ${tournament.sport}; focus on ${style}.`,
      `Tournament: ${tournament.name} at ${tournament.location}.`,
      `Format: ${tournament.match_format}; capacity ${tournament.number_of_teams}; approved teams ${tournament.approved_registrations_count}.`,
      "Task: write a short, energetic update that helps captains and organizers act quickly.",
    ].join("\n"),
    output: `${tournament.name} is building nicely at ${tournament.location}. The ${tournament.match_format} format should reward teams that start fast and manage pressure well. With ${health.slotsLeft} slots still open and ${health.fillRate}% approved capacity, organizers should keep registrations moving while captains lock in player availability early.`,
  };
}

export function buildOrganizerActions(tournaments) {
  if (!tournaments.length) {
    return [
      "Create the first tournament with clear dates, venue, fee, prize, and format.",
      "Publish a short announcement with registration deadline and captain contact rules.",
      "Add a banner so the public board feels active and trustworthy.",
    ];
  }

  return tournaments.slice(0, 3).map((tournament) => {
    const health = getTournamentHealth(tournament);
    if (health.fillRate >= 85) {
      return `${tournament.name}: prepare fixtures and waitlist messaging; only ${health.slotsLeft} slots remain.`;
    }
    if (health.fillRate >= 55) {
      return `${tournament.name}: approve pending teams and post a final call for ${tournament.location}.`;
    }
    return `${tournament.name}: boost registrations with a prize-led post and captain outreach.`;
  });
}

export function buildTeamPrep(registration) {
  const sport = registration.tournament_sport || "sport";
  const status = registration.status;
  if (status === "approved") {
    return `Approved for ${registration.tournament_name}. Confirm squad IDs, jerseys, arrival time, and one backup player before match day.`;
  }
  if (status === "rejected") {
    return `Entry was rejected for ${registration.tournament_name}. Contact the organizer, fix missing details, and choose another open ${sport} event.`;
  }
  return `Pending for ${registration.tournament_name}. Keep the captain phone active and prepare player list proof so approval can move faster.`;
}
