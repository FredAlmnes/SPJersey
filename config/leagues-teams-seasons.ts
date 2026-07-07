// config/leagues-teams-seasons.ts
// Static league/team/national-team catalog for the current season only (D-01..D-04).
// CURRENT_SEASON is the single source of truth for the season string — never
// duplicate a season value inline on a team (Pitfall 4).
export const CURRENT_SEASON = "2025/26" as const;

export interface Team {
  id: string;
  name: string;
}

export interface League {
  id: string;
  name: string;
  teams: Team[];
}

function team(id: string, name: string): Team {
  return { id, name };
}

export const LEAGUES: League[] = [
  {
    id: "premier-league",
    name: "Premier League",
    teams: [
      team("arsenal", "Arsenal"),
      team("aston-villa", "Aston Villa"),
      team("bournemouth", "Bournemouth"),
      team("brentford", "Brentford"),
      team("brighton", "Brighton & Hove Albion"),
      team("burnley", "Burnley"),
      team("chelsea", "Chelsea"),
      team("crystal-palace", "Crystal Palace"),
      team("everton", "Everton"),
      team("fulham", "Fulham"),
      team("leeds-united", "Leeds United"),
      team("liverpool", "Liverpool"),
      team("manchester-city", "Manchester City"),
      team("manchester-united", "Manchester United"),
      team("newcastle-united", "Newcastle United"),
      team("nottingham-forest", "Nottingham Forest"),
      team("sunderland", "Sunderland"),
      team("tottenham-hotspur", "Tottenham Hotspur"),
      team("west-ham-united", "West Ham United"),
      team("wolverhampton-wanderers", "Wolverhampton Wanderers"),
    ],
  },
  {
    id: "eliteserien",
    name: "Eliteserien",
    teams: [
      team("bodo-glimt", "Bodø/Glimt"),
      team("brann", "Brann"),
      team("bryne", "Bryne"),
      team("fredrikstad", "Fredrikstad"),
      team("hamkam", "HamKam"),
      team("haugesund", "Haugesund"),
      team("kfum-oslo", "KFUM Oslo"),
      team("kristiansund", "Kristiansund"),
      team("lillestrom", "Lillestrøm"),
      team("molde", "Molde"),
      team("odd", "Odd"),
      team("rosenborg", "Rosenborg"),
      team("sandefjord", "Sandefjord"),
      team("sarpsborg-08", "Sarpsborg 08"),
      team("stabaek", "Stabæk"),
      team("stromsgodset", "Strømsgodset"),
      team("tromso", "Tromsø"),
      team("valerenga", "Vålerenga"),
      team("viking", "Viking"),
      team("rakkestad", "Rakkestad"),
    ],
  },
  {
    id: "laliga",
    name: "LaLiga",
    teams: [
      team("alaves", "Alavés"),
      team("athletic-bilbao", "Athletic Bilbao"),
      team("atletico-madrid", "Atlético Madrid"),
      team("barcelona", "Barcelona"),
      team("betis", "Real Betis"),
      team("celta-vigo", "Celta Vigo"),
      team("elche", "Elche"),
      team("espanyol", "Espanyol"),
      team("getafe", "Getafe"),
      team("girona", "Girona"),
      team("levante", "Levante"),
      team("mallorca", "Mallorca"),
      team("osasuna", "Osasuna"),
      team("rayo-vallecano", "Rayo Vallecano"),
      team("real-madrid", "Real Madrid"),
      team("real-oviedo", "Real Oviedo"),
      team("real-sociedad", "Real Sociedad"),
      team("sevilla", "Sevilla"),
      team("valencia", "Valencia"),
      team("villarreal", "Villarreal"),
    ],
  },
  {
    id: "serie-a",
    name: "Serie A",
    teams: [
      team("atalanta", "Atalanta"),
      team("bologna", "Bologna"),
      team("cagliari", "Cagliari"),
      team("como", "Como"),
      team("cremonese", "Cremonese"),
      team("fiorentina", "Fiorentina"),
      team("genoa", "Genoa"),
      team("inter", "Inter"),
      team("juventus", "Juventus"),
      team("lazio", "Lazio"),
      team("lecce", "Lecce"),
      team("milan", "Milan"),
      team("napoli", "Napoli"),
      team("parma", "Parma"),
      team("pisa", "Pisa"),
      team("roma", "Roma"),
      team("sassuolo", "Sassuolo"),
      team("torino", "Torino"),
      team("udinese", "Udinese"),
      team("verona", "Verona"),
    ],
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    teams: [
      team("augsburg", "Augsburg"),
      team("bayer-leverkusen", "Bayer Leverkusen"),
      team("bayern-munich", "Bayern München"),
      team("borussia-dortmund", "Borussia Dortmund"),
      team("borussia-monchengladbach", "Borussia Mönchengladbach"),
      team("eintracht-frankfurt", "Eintracht Frankfurt"),
      team("fc-heidenheim", "1. FC Heidenheim"),
      team("fc-koln", "1. FC Köln"),
      team("freiburg", "SC Freiburg"),
      team("hamburger-sv", "Hamburger SV"),
      team("hoffenheim", "TSG Hoffenheim"),
      team("mainz-05", "Mainz 05"),
      team("rb-leipzig", "RB Leipzig"),
      team("st-pauli", "FC St. Pauli"),
      team("stuttgart", "VfB Stuttgart"),
      team("union-berlin", "Union Berlin"),
      team("werder-bremen", "Werder Bremen"),
      team("wolfsburg", "VfL Wolfsburg"),
    ],
  },
];

export const NATIONAL_TEAMS: Team[] = [
  team("norway", "Norge"),
  team("brazil", "Brazil"),
  team("france", "France"),
  team("germany", "Germany"),
  team("spain", "Spain"),
  team("england", "England"),
  team("argentina", "Argentina"),
  team("portugal", "Portugal"),
  team("netherlands", "Netherlands"),
  team("italy", "Italy"),
  team("belgium", "Belgium"),
  team("croatia", "Croatia"),
];
