var program = require('commander'),
	iode = require('../package.json'),
	beauty = require("js-beautify").js_beautify,
	Parser = require('./parser').Parser,
	fs = require('fs'),
	path = require('path');

program
	.version(iode.version)
	.usage('[options] <files ...>')
	.option('-r, --run', 'runs program without outputting generated code')
	.option('-o, --output', 'outputs the generated code')
	.option('-d, --dev', 'runs developer testing mode')
	.option('-t, --tokens', 'outputs AST tokens, not lexer tokens')
	.parse(process.argv);

	var run_cmd = function(cmd, args, callBack) {
		var spawn = require('child_process').spawn;
		var child = spawn(cmd, args);
		var resp = "";

		child.stdout.on('data', function(buffer) {
			resp += buffer.toString()
		});

		child.stdout.on('end', function() {
			callBack(resp)
		});
	};

if (program.args.length >= 0) {
	var fileNames = [];

	program.args.forEach(function(file) {
		var filename = path.join(process.cwd(), file);
		var code;

		try {
			code = fs.readFileSync(filename) + '\n';
		} catch (e) {
			if (e.code === 'ENOENT') {
				console.error('[x] File not found: ' + filename);
				// TODO: Break out of the iteration and move on
			} else {
				throw e;
			}
		}

		var parser = new Parser(code.toString(), path.dirname(filename));
		var ast = parser.parse();
		var outputCode = '/* Generated by Iode v' + iode.version + ' */\n';

		try {
			for (var expr in ast) {
				outputCode += '\n' + ast[expr].val;
			}
		} catch (e) {
			console.error('[x] Could not generate code. ' + e);
		}

		outputCode = beauty(outputCode, { indent_size: 2 });

		if (program.tokens) {
			parser.treeTokens(ast);
		}

		if (program.output) {
			fs.writeFileSync(filename.replace('.iode', '.js'), outputCode);
			fileNames.push(filename.replace('.iode', '.js'));
		}

		if (program.run) {
			for (file in fileNames) {
				run_cmd("node", [fileNames[file]], function(text) {
					console.log("\n[" + file + "] " + text);
				});
			}
		}

		if (program.dev) {
			require("./developer.js");
		}
	});

	if (program.output) {
		console.log();
		console.log();

		for (name in fileNames) {
			console.log('> ' + fileNames[name]);
		}
	}
} else {
	program.help();
}
