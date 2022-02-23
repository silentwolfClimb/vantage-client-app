import axios from 'axios';
import { useEffect, useState } from 'react';
import { TokenType } from 'powerbi-models';
import { PowerBIEmbed, EmbedType } from 'powerbi-client-react';
import React from 'react';

// NOTE: TO RUN THE MONO REPO WITH THE VANTAGE BRANCH, PLEASE ADD THE SNIPPET BELOW TO THE pub/app.js after line 497
//  const cors = require('cors');
//  app.use(cors({ origin: '*'}));

/**
 * Vantage Params
 * corporateEntityId: This can be `all` or corporateEntityId
 * email: There is no need for this as we can get via current session but this might be needed for those using Authorization /Api-Key
 * embedType: default is report, check the EmbedType
 * reportId: This is reportType or reportId, type can be any of predefined in vantage services such as Recurring, Remittance . but for test, it is always PRELIM.
 * settings: This is powerbi settings config that aid further client filtering if need be.
 * accessLevel: Optional but it can be any of View, Edit, Create
 * authorizationType: We have `auth`, `session` and `api-key` or blank which is session.
 * corporateEntityKey: This is optional but important if using `API-Key` as means of authorization.
 * props: This is other powerBI property supported.
 */
function Vantage(
    {
        corporateEntityId,
        reportId,
        embedType = EmbedType.Report,
        settings = {},
        email = '',
        accessLevel = '',
        authorizationType = 'session',
        corporateEntityKey = '',
        ...props
    }) {
    const [embedConfig, setEmbedConfig] = useState( {} );
    const apiConfig = {};

    // We need to reference the baseURL here for school-portal adaptation.
    let url = `http://localhost:3333/api/v1/vantages/${ corporateEntityId }/reports/${ reportId }`;

    if ( email ) {
        url = `${ url }?email=${ email }`;
    }

    if ( accessLevel ) {
        const delimiter = url.includes( '?' ) ? '&' : '?';
        url = `${ url }${ delimiter }accessLevel=${ accessLevel }`;
    }

    // Headers settings type here.
    if (authorizationType !== 'session') {

        if ( authorizationType === 'auth' ) {
            apiConfig.headers = { authorization: 'fCrEw2+HgZkC3kCkYwWMg0OX+s+TmdLhfudI/4J9jNc=' };
        }

        if ( authorizationType === 'api-key' && corporateEntityKey ) {
            apiConfig.headers = { ['API-KEY']: corporateEntityKey };
        }
    }

    const getReportDetails = async () => {
        try {
            const { data: record } = (await axios.get( url, apiConfig )).data;
            console.log( 'record=', record );
            if ( record ) {
                const config = {
                    type: embedType || EmbedType.Report,
                    id: record.id,
                    embedUrl: record.embedUrl,
                    accessToken: record.embedToken,
                    expiry: record.embedExpiration,
                    tokenType: TokenType.Embed,
                    groupId: record.groupId,
                    datasetId: record.datasetId,
                };

                if ( Object.keys( settings ).length > 0 ) {
                    config.settings = settings;
                }

                setEmbedConfig( config );
            }
        } catch ( e ) {
            console.log( 'Error=', e.stack );
        }
    };

    const refreshEvent = (evt) => {
        console.log( 'mousemove action' );
        const currentTime = Date.now();
        const expiryTime = new Date( embedConfig.expiry ).getTime();

        if ( currentTime > expiryTime - 10000 ) {
            // Do data refresh here.
            getReportDetails();
        }
    };

    useEffect( () => {
        getReportDetails();
    }, [] );

    if ( Object.keys( embedConfig ).length <= 0 ) {
        return <div> Loading.... </div>;
    }

    console.log( 'embedConfig=', embedConfig );

    return <div style={ { width: '100%', height: '100%' } } onMouseMove={ (ev) => refreshEvent( ev ) }>
        <PowerBIEmbed embedConfig={ embedConfig } { ...props } />
    </div>;

}

export default Vantage;
