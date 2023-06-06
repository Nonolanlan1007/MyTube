#! /usr/bin/env node

const inquirer = require('inquirer')
const Listr = require('listr')
const youtubedl = require('youtube-dl-exec')
const {copyFile, unlink} = require('fs/promises')
const {text} = require('figlet')

console.clear()
text("MyTube", { font: "Standard"}, function(err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data)
    console.log("\n\n\n")
});

const checks = new Listr([
    {
        title: "Vérification de l'OS",
        task: () => {
            if (process.env.OS !== 'Windows_NT') throw new Error('Actuellement, MyTube n\'est compatible que sur Windows.')
        }
    },
    {
        title: "Vérification des mises à jours",
        task: () => {}
    }
])

setTimeout(() => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'url',
            message: 'Quelle est l\'URL de la vidéo/playlist à télécharger ?\n> ',
            validate: (input) => {
                if (input.length === 0) return 'Veuillez entrer une URL.'
                if (!input.startsWith('https://www.youtube.com/')) return 'Veuillez entrer une URL YouTube.'
                const url = new URL(input)
                if (!url.searchParams.get('list') && !url.searchParams.get('v')) return 'Veuillez entrer une URL valide.'
                return true
            }
        }
    ]).then(async (answers) => {
        const url = answers.url
        const format = answers.format
    
        let list = []
    
        const tasks = new Listr([
            {
                title: "Récupération des informations",
                async task () {
                    const res = await youtubedl(url, { dumpSingleJson: true })
    
                    if (res) {
                        if (res.entries) for (const entry of res.entries) list.push(entry)
                        else if (!res.playlist_count) list.push(res)
                    }
                    else throw new Error('Impossible de récupérer les informations de la vidéo/playlist.')
                }
            },
            {
                title: "Téléchargement du contenu",
                task: async () => {
                    return new Listr(list.map((entry) => {
                        return {
                            title: `[${list.indexOf(entry) + 1}/${list.length}] ${entry.title}`,
                            task: async (task) => {
                                await youtubedl(entry.webpage_url, {
                                    audioFormat: "mp3"
                                }).catch((err) => {
                                    throw new Error(err.message)
                                })
    
                                await copyFile(`${entry.title} [${entry.id}].mp4`, `${process.env.HOMEDRIVE}${process.env.HOMEPATH}\\Downloads\\${entry.title}.mp4`).catch((err) => {
                                    throw new Error(err.message)
                                })
                                await unlink(`${entry.title} [${entry.id}].mp4`).catch((err) => {
                                    throw new Error(err.message)
                                })
                            }
                        }
                    }), { concurrent: true })
                }
            }
        ])
    
        tasks.run().catch(() => {}).then(() => {
            console.log('Téléchargement terminé !')
            console.log("\n")
            console.log(`Vous pouvez retrouver vos fichiers dans le dossier "Téléchargements" de votre ordinateur.`)
        })
    })
}, 500)