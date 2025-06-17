const fs = require('fs');
const path = require('path');

class ChangelogManager {
    constructor() {
        this.changelogPath = path.join(__dirname, '../data/changelog.json');
        this.currentChanges = [];
        this.ensureChangelogExists();
    }

    ensureChangelogExists() {
        if (!fs.existsSync(this.changelogPath)) {
            fs.writeFileSync(this.changelogPath, JSON.stringify({ versions: [] }, null, 4));
        }
    }

    addChange(change) {
        this.currentChanges.push(change);
    }

    async saveVersion(version) {
        const changelog = JSON.parse(fs.readFileSync(this.changelogPath, 'utf8'));
        
        const newVersion = {
            version: version,
            date: new Date().toISOString().split('T')[0],
            changes: this.currentChanges
        };

        changelog.versions.unshift(newVersion);
        fs.writeFileSync(this.changelogPath, JSON.stringify(changelog, null, 4));
        this.currentChanges = [];
        
        return newVersion;
    }

    getLatestChanges() {
        const changelog = JSON.parse(fs.readFileSync(this.changelogPath, 'utf8'));
        return changelog.versions[0] || null;
    }

    getAllChanges() {
        const changelog = JSON.parse(fs.readFileSync(this.changelogPath, 'utf8'));
        return changelog.versions;
    }
}

module.exports = new ChangelogManager();
