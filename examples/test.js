
const { Connector } = require('../dist/index');

async function main() {
    const connection = await Connector.connectUrl('mysql://test:test@localhost:3306/test');
    await connection.load(true);


    await connection.disconnect();
}

main();
