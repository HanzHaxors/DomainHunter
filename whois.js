const net = require('net');

const SERVER = 'whois.iana.org';
const PORT = 43;
const TIMEOUT = 5000;

const CRLF = '\r\n';

class WhoisContact {
	constructor(type, name, organisation='', address='', phone='', fax='', email='') {
		this.contact = this.type = type;
		this.name = name;
		this.organisation = organisation;
		this.address = address;
		this.phone = phone;
		this.fax = fax;
		this.email = email;
	}
}

class WhoisIANAResponse {
	constructor() {
		this.server = '';
		this.domain = '';
		this.registrar = {};
		this.createdAt = 0;
		this.updatedAt = 0;
		this.contacts = [];
		this.nservers = [];
		this.status = 'ACTIVE';
	}
}

function parseIANAResponse(res) {
	let lines = res.split('\n');
	let response = new WhoisIANAResponse();

	for (const line of lines) {
		if (line == '') continue;

		let tag = line.split(':')[0];
		switch (tag) {
			case 'whois':
				let s = line.split(':');
				s.shift();
				response.server = s.join(':').trim();
				break;
		}
	}

	return response;
}

function parseWhoisResponse(res) {
	return res;
}

async function lookup(name, server='') {
	return new Promise((resolve, reject) => {
		let response = '';
		let query = name;
		let socket = net.createConnection(PORT, server || SERVER, () => socket.write(query + CRLF));

		socket.setEncoding('utf8');
		socket.setTimeout(TIMEOUT);

		socket.on('data', (data) => {
			response += data;
		});

		socket.on('end', async () => {
			socket.destroy();

			console.log(response);

			if (server === '') {
				response = parseIANAResponse(response);
				let newServer = response.server;
				resolve(await lookup(name, newServer));
			} else {
				response = parseWhoisResponse(response);
				resolve(response);
			}
		});

		socket.on('error', (err) => {
			reject(err);
		});

		socket.on('timeout', () => {
			reject("Server timeout");
		});
	});
}

(async () => {
	console.log(await lookup(process.argv[2]));
})();
