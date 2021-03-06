const mongoose = require('mongoose');
const fs = require('fs');

const dbRoute = 'mongodb://localhost/kamus-aceh-db-test';

mongoose.connect(
    dbRoute,
    { useNewUrlParser: true }
);

let db = mongoose.connection;

db.once('open', () => console.log('Connected to MongoDB'));

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const kataSchema = new mongoose.Schema({
    words: { type: String, required: true },
    word_type: { type: String, required: true },
    
    // bcs might be more than one translation, store in array
    translations: { type: Array, required: true },
    definitions: { type: Array },
    synonyms: { type: Array },
    examples: { type: Array }
});

const Kata = mongoose.model('word', kataSchema);

async function createKata(data) {
    
    try {        
        const kata = new Kata(data);
    
        const result = await kata.save();
        console.log(result);
    } catch (error) {
        console.log('==================================================================');
        console.log('==================================================================');
        console.log('==================================================================');
        console.log('========PERINGATAN!!! ADA ERROR PADA SAAT MEMASUKKAN DATA INI=====');
        console.log('================COBA PERIKSA LAGI DATA BERIKUT====================');
        console.log(data);
        console.log('==================================================================');
        console.log('==================================================================');
    }

    // ==== structure how data should be saved in database === 
    // createKata( {
    //     words: 'a',
    //     word_type: 'n',
    //     synonyms: ['b', 'c', 'd'],
    //     translations: ['x', 'y', 'z'],
    //     examples: [
    //         {
    //             word: 'a',
    //             translation: 'b'
    //         }
    //     ]
    // });
}

change_example_with_current_word  = (example, word) => {

    // the task of this function is the replace received array of couple word example 
    // and their translation with the word received in this function
    //
    //  example = [
    //      { 
    //          word: 'boh mamplam ==',
    //          translation: 'bauh mangga enak'
    //      },
    //      {
    //          word: 'hana == badan',
    //          translation: 'tidak enak badan'
    //      }
    //  ]
    //
    //  word = 'mangat'

    if ( example ) {
        return example.map( cur => {
            return {
                word: cur.word.replace(/==/g, word),
                translation: cur.translation.replace(/==/g, word),            
            }
        })
    }
    else return example;
}

const spreadData = (params, data, word_type) => {

    if (data.includes( params )){

        let typeRegex = new RegExp(params,"g");

        // split 'words' data and others data
        let words_on_data = data.split(typeRegex);

        // sign index [0] of split result data as 'words' attribute
        let words = words_on_data[0].trim();

        // and sign index [1] as others data
        let words_on_data_other = words_on_data[1];

        // then split that others data by ':' 
        // to split 'translations and definitions' data and others data
        let trans_on_data = words_on_data_other.split(/:/);


        let translations, definitions;

        // checking if in trans_on_data include '$', that mean there is definitions data too
        // if there is, then store each data in variable
        if (trans_on_data[0].includes('$'))
        {   
            // split 'translations and definitions' data by '$'
            // [0] == translations, [1] == definitions
            let translations_and_definitions = trans_on_data[0].split('$');
            
            // sign index [0] as 'translations' data and
            // split them by ',' that mean there is more than one translation and them as array
            translations = translations_and_definitions[0].split(/,/).filter(cur => {
                if (cur.trim()) return cur;
            } );

            // trim each word translation in array
            translations = translations.map( cur => cur.trim().replace(/]/g, ','));
            
            // sign index [0] as 'translations' data and
            // split them by ',' that mean there is more than one translation and them as array
            definitions = translations_and_definitions[1].split(/,/).map(cur => cur.trim().replace(/]/g, ',') );
        }else {
            
            translations = trans_on_data[0].split(/,/).map(cur => cur.trim().replace(/]/g, ',') );

            definitions = [];
        }

        // then sign index [1] as others data
        let trans_on_data_other = trans_on_data[1];

        let examples, synonyms = [];

        let exam_on_data;

        // checking of there any data in index [1] array
        // if it is 'true', it mean there is data 'examples' word
        // and maybe data 'synonyms' to
        if (trans_on_data_other){

            // split data 'examples' and 'synonyms' by '>' notation
            // if there is any synonyms data
            exam_on_data = trans_on_data_other.split(/>/).map(cur => cur.trim() );

            // checking if there is any example data by 
            if (exam_on_data[0]) {

                // if there more than one examples that sign and split by ';'
                // then split each one of them and add into an array
                examples = exam_on_data[0].split(/;/);
                
                // an example contain two data; the word and its translation
                // that sign and split by ',' notation
                // split them by ',' and make them as object:
                // { word: 'example', translation: 'example translation'}
                examples = examples.map( cur => {
                    examp = {};
                    
                    let examp_on_data = cur.split(/,/);
                    
                    if (examp_on_data[0]) {
                        examp['word'] = examp_on_data[0].trim().replace(/]/g, ',');
                    }
                    else {
                        console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                        console.log('+++++ WARNIGGG!!!!! TIDAK ADA DATA "KATA" PADA KATA = "' + words + '" +++++');
                        console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                        console.log(data);
                        console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                        console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                    }

                    if (examp_on_data[1]) {
                        examp['translation'] = examp_on_data[1].trim().replace(/]/g, ',');
                    }
                    else{
                        console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                        console.log('+++++ WARNIGGG!!!!! TIDAK ADA DATA "TERJEMAHAN" PADA KATA = "' + words + '" +++++');
                        console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                        console.log(data);
                        console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                        console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                    } 
                    
                    return examp;
                });
            }

            // if there any data as index [1] on array elements
            // it means there is 'synonyms' data
            // split it by ',' if there is more than synonyms data
            // that sign by ',' notations
            if ( exam_on_data[1] ) {
                synonyms = exam_on_data[1]
                    .split(/,/)
                    .map( cur =>  { 
                        return cur.trim().replace(/]/g, ',');
                    });
            }

        }

        // checking if word include ',' that mean there more than one word
        // if "true", add them all into different rows in the database
        // if "false" add them in one rows in the database
        if (words.includes(',')) {
            
            // split each 'word' by ',' bcs them will saved as different word
            words = words.split(/,/).map(cur => cur.trim().replace(/]/g, ','));

            // add all 'words' as synonyms of the each all of them
            synonyms = synonyms.concat(words);
            
            words.forEach( word => {

                // remove itself 'word' from 'synonyms' array
                // because them can't be synonyms to theirself
                let synonyms_filtered = synonyms.filter((value) => {
                    return value !== word;                
                });
                
                // because earlier synonyms is concated beetween synonyms
                // itself and 'words' array, maybe there duplcate word
                // so each element of array should be unique
                synonyms_filtered = [...new Set(synonyms_filtered)];
                
                // save data to the database
                createKata({
                    words: word,
                    word_type: word_type,
                    translations: translations,
                    definitions: definitions,
                    synonyms: synonyms_filtered,
                    examples: change_example_with_current_word(examples, word)
                });
            });

        }
        else{
            
            // save data to the database
            createKata({
                words: words,
                word_type: word_type,
                translations: translations,
                definitions: definitions,
                synonyms: synonyms,
                examples: change_example_with_current_word(examples, words)
            });
        };

    };
}

function readFileTxt(file) {
    fs.readFile(file, 'utf-8', (err, data) => {
        if (!err) {

            // split them by "new" word that mean it is a different data
            // put each one of them (data) as different array element
            let res = data.toString().split(/new/);
            
            // loop all of array element and check all of them to process 1 by 1
            res.forEach( cur => {
                let data = cur.trim();

                spreadData(' noun ', data, 'kata benda');

                spreadData(' verb ', data, 'kata kerja');

                spreadData(' adjective ', data, 'kata sifat');

                spreadData(' adverb ', data, 'kata keterangan');

                spreadData(' partikel ', data, 'kata sandang');

                spreadData(' interjeksi ', data, 'kata seru');

                spreadData(' suffix ', data, 'sufiks');

                spreadData(' numeralia ', data, 'kata bilangan');

                spreadData(' preposisi ', data, 'kata depan');

            });

        } else console.log(err);
    });
}

readFileTxt('test.txt');