#! /usr/bin/env node

const Listr = require('listr')
const {text} = require('figlet')
const {exec} = require('child_process')
const downloader = require('./downloader')

async function MyTube () {
    await console.clear()
    await text("MyTube", { font: "Standard"}, function(err, data) {
        if (err) {
            console.log('Something went wrong...');
            console.dir(err);
            return;
        }
        console.log(data)
        console.log("\n\n\n")

        const checks = new Listr([
            {
                title: "Vérification de l'OS",
                task: () => {
                    if (process.env.OS !== 'Windows_NT') throw new Error('Actuellement, MyTube n\'est compatible que sur Windows.')
                }
            },
            {
                title: "Vérification des mises à jours",
                task: async () => await exec("npm install -g mytube@latest", (error, stdout, stderr) => {
                    if (error) {
                        Promise.reject(error);
                        return;
                    }
                    if (stderr) {
                        Promise.reject(stderr);
                        return;
                    }
                    Promise.resolve(stdout)
                })
            }
        ])

        checks.run().catch(() => process.exit()).then(async () => {
            console.log("\n")
            await downloader()
        })
    });    
}

MyTube()