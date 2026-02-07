const SOLR_HOST = process.env.SOLR_HOST || 'http://localhost:8983/solr';

module.exports = {
    search: async (core, query) => {
        try {
            // Build Solr query
            const params = new URLSearchParams({
                q: query,
                wt: 'json',
                rows: 100
            });

            // If query is simple text, search common fields
            if (!query.includes(':')) {
                // Orders might search by order_number
                params.set('q', `text:${query}* OR order_number:${query}* OR description:${query}*`);
            }

            const response = await fetch(`${SOLR_HOST}/${core}/select?${params.toString()}`);

            if (!response.ok) {
                console.warn(`Solr search failed for core ${core}: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            return data.response.docs;
        } catch (error) {
            console.error('Solr search error:', error.message);
            return null;
        }
    },

    add: async (core, data) => {
        try {
            // Ensure ID is string for Solr
            const doc = { ...data, id: String(data.id) };

            const response = await fetch(`${SOLR_HOST}/${core}/update?commit=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([doc])
            });
            return response.ok;
        } catch (error) {
            console.error('Solr add error:', error.message);
            return false;
        }
    },

    delete: async (core, id) => {
        try {
            const body = { delete: { id: String(id) } };
            const response = await fetch(`${SOLR_HOST}/${core}/update?commit=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            return response.ok;
        } catch (error) {
            console.error('Solr delete error:', error.message);
            return false;
        }
    }
};
