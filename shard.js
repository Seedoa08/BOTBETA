const { ShardingManager } = require('discord.js');
const manager = new ShardingManager('./index.js', { token: 'VOTRE_TOKEN' });

manager.on('shardCreate', shard => console.log(`Lancement du shard ${shard.id}`));
manager.spawn();
