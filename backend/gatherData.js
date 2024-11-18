const SparqlClient = require('sparql-client-2');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PROLOG_FILE_PATH = path.join(__dirname, 'prolog_data.pl');
const BATCH_SIZE = 50;
const TOTAL_QUESTIONS = 1000;
const FETCH_INTERVAL = 30000;
const client = new SparqlClient('https://query.wikidata.org/sparql', { headers: { 'User-Agent': 'Node.js' } });

const queries = {
    countriesAndCapitals: `
        SELECT ?countryLabel ?capitalLabel
        WHERE {
          ?country wdt:P31 wd:Q6256; wdt:P36 ?capital.
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 50
    `,
    peopleAndProfessions: `
        SELECT ?personLabel ?professionLabel
        WHERE {
          ?person wdt:P106 ?profession.
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 50
    `,
    moviesAndReleaseYears: `
        SELECT ?movieLabel ?releaseYear
        WHERE {
          ?movie wdt:P31 wd:Q11424; wdt:P577 ?date.
          BIND(YEAR(?date) AS ?releaseYear)
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 50
    `,
};

async function fetchDataFromSPARQL() {
    let prologData = '';
    for (const [topic, query] of Object.entries(queries)) {
        const response = await client.query(query).execute();
        if (response && response.results.bindings) {
            if (topic === 'countriesAndCapitals') {
                prologData += response.results.bindings.map(result =>
                    `capital("${result.countryLabel.value}", "${result.capitalLabel.value}").\n`
                ).join('');
            } else if (topic === 'peopleAndProfessions') {
                prologData += response.results.bindings.map(result =>
                    `profession("${result.personLabel.value}", "${result.professionLabel.value}").\n`
                ).join('');
            } else if (topic === 'moviesAndReleaseYears') {
                prologData += response.results.bindings.map(result =>
                    `release_year("${result.movieLabel.value}", ${result.releaseYear.value}).\n`
                ).join('');
            }
        }
    }
    fs.appendFileSync(PROLOG_FILE_PATH, prologData);
    console.log('SPARQL data saved to Prolog file.');
}

async function fetchQuestionsFromAPI(amount) {
    try {
        const response = await axios.get(`https://opentdb.com/api.php?amount=${amount}`);
        return response.data.results;
    } catch (error) {
        console.error('Error fetching trivia questions:', error);
        return [];
    }
}

async function saveQuestionsInProlog(questions) {
    const data = questions.map((q, i) =>
        `question(${i}, "${q.question.replace(/"/g, '\\"')}", "${q.correct_answer.replace(/"/g, '\\"')}", [${q.incorrect_answers.map(a => `"${a.replace(/"/g, '\\"')}"`).join(", ")}]).\n`
    ).join('');
    fs.appendFileSync(PROLOG_FILE_PATH, data);
    console.log('Trivia questions saved to Prolog.');
}

async function gatherDataInBatches() {
    fs.writeFileSync(PROLOG_FILE_PATH, '');
    await fetchDataFromSPARQL();

    let totalFetched = 0;
    const intervalId = setInterval(async () => {
        if (totalFetched >= TOTAL_QUESTIONS) {
            clearInterval(intervalId);
            console.log('Data gathering completed.');
            return;
        }
        const questions = await fetchQuestionsFromAPI(BATCH_SIZE);
        await saveQuestionsInProlog(questions);
        totalFetched += questions.length;
        console.log(`Total questions saved: ${totalFetched}`);
    }, FETCH_INTERVAL);
}

gatherDataInBatches();
