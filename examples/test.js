const { SchemaBuilder, ForeignKeyUpdateRule } = require("../dist/index");
const { Connector } = require('../dist/index');

async function main() {
    const connection = await Connector.connectUrl('mysql://test:test@localhost:3306/test');
    const schema = new SchemaBuilder();
    schema.database('test', d => d
        .table('users', t => t
            .id()
            .column('name', c => c
                .string(128)
                .unique()
                .comment('The User Name')
            )
            .column('email', c => c
                .string(128)
                .unique()
                .comment('The User Name')
            )
        )
        .table('user_profiles', t => t
            .index(['first_name', 'last_name'])
            .id()
            .column('user_id', c => c
                .reference('users', ['id'], { onDelete: ForeignKeyUpdateRule.CASCADE })
            )
            .column('first_name', c => c
                .string(128)
                .comment('The User Name')
            )
            .column('last_name', c => c
                .string(128)
                .comment('The User Name')
            )
        )
    );

    const schemaData = schema.getData();

    await connection.hydrate(schemaData);
    await connection.save(true);

    const name = 'Torben';

    // console.log(await connection.driver.getKey('test', 'users', 'FK_users_user_profiles'));
    console.log(

        // await users
        //     .with({ name })
        //     .where(user => user.name in [`:name`, 'A', 'B', 'C'])
        //     .select(user => ({
        //         userId: user.id,
        //         userName: user.name
        //     }))
        // .select((u, up) => [u.id, u.name, up.first_name, up.last_name])
        // .leftJoin('user_profiles', (u, up) => u.profile_id = up.id)
        // .where((u, up) => u.name === 'torben' || up.firstName === 'demacia')
        // .orderBy((u, up) => [u.id, up.id])
        // .orderBy(u => u.last_login, 'desc');
    );

    await connection.disconnect();
}

main().catch(err => console.error(err, err.stack));
