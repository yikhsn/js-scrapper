const mongoose = require('mongoose');
const fs = require('fs');

const dbRoute = 'mongodb://localhost/kamus-aceh-test';

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

    // sometimes there more than one translation, store it in an array
    translations: { type: Array, required: true },
    synonyms: { type: Array },
    examples: { type: Array }
});

const Kata = mongoose.model('Kata', kataSchema);

async function createKata(data) {
    const kata = new Kata(data);

    const result = await kata.save();
    console.log(result);
}

function readFileTxt(file) {
    fs.readFile(file, 'utf-8', (err, data) => {
        if (!err) {

            // let myregex = new RegExp(  )
            let res = data.toString().split(/new/);
            
            let stackText = [];

            res.forEach( cur => {
            
                let data = cur.trim();

                if (data.includes( ' n ' )){
                    let words_on_data = data.split(/ n /);

                    let words = words_on_data[0];

                    let words_on_data_other = words_on_data[1];
                   
                    let trans_on_data = words_on_data_other.split(/:/);

                    let translations = trans_on_data[0].split(/,/);

                    let trans_on_data_other = trans_on_data[1];

                    let examples, synonyms = [];

                    let exam_on_data;

                    if (trans_on_data_other){

                        exam_on_data = trans_on_data_other.split(/>/);

                        examples = exam_on_data[0].split(/;/);

                        examples = examples.map( cur => {
                            examp = {};

                            let examp_on_data = cur.split(/,/);

                            examp['word'] = examp_on_data[0].trim();
                            examp['translation'] = examp_on_data[1].trim();

                            return examp;

                        });

                        if ( exam_on_data[1] ) {
                            synonyms = exam_on_data[1]
                                .split(/,/)
                                .map( cur => cur.trim() );
                        }

                    }

                    if (words.includes(',')) {
                        
                        words = words.split(/,/);

                        
                        words.forEach( word => {
                            
                            // synonyms = synonyms.concat(words);

                            createKata({
                                words: word,
                                word_type: 'kata sifat',
                                translation: translations,
                                synonyms: synonyms,
                                examples: examples
                            });
                        });

                    }
                    else{
                        createKata({
                            words: words,
                            word_type: 'kata sifat',
                            translation: translations,
                            synonyms: synonyms,
                            examples: examples
                        });
                    };

                };

            });

        } else {
            console.log(err);
        }
    });
}

readFileTxt('test.txt');

// ============The Structure How Will We Save Data ==========
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