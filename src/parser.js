var Lexer = require("./lexer").Lexer,
	fs = require("fs"),
	path = require("path"),
	TokenType = require("./token").TokenType,
	IodeNumber = require("./ast").IodeNumber,
	IodeBinaryOp = require("./ast").IodeBinaryOp,
	IodeIdentifier = require("./ast").IodeIdentifier,
	IodeVariableDeclaration = require("./ast").IodeVariableDeclaration,
	IodeBoolean = require("./ast").IodeBoolean,
	IodeString = require("./ast").IodeString,
	IodeFunction = require("./ast").IodeFunction,
	IodePrototype = require("./ast").IodePrototype,
	IodeParenthesis = require("./ast").IodeParenthesis,
	IodeCall = require("./ast").IodeCall,
	IodeCallList = require("./ast").IodeCallList,
	IodeNewline = require("./ast").IodeNewline,
	IodeWhile = require("./ast").IodeWhile,
	IodeUntil = require("./ast").IodeUntil,
	IodeIf = require("./ast").IodeIf,
	IodeElsIf = require("./ast").IodeElsIf,
	IodeElse = require("./ast").IodeElse,
	IodeIfChain = require("./ast").IodeIfChain,
	IodeNot = require("./ast").IodeNot,
	IodeNew = require("./ast").IodeNew,
	IodeForeach = require("./ast").IodeForeach,
	IodeConstant = require("./ast").IodeConstant,
	IodeReturn = require("./ast").IodeReturn,
	IodeContinue = require("./ast").IodeContinue,
	IodeThrow = require("./ast").IodeThrow,
	IodeInclude = require("./ast").IodeInclude,
	IodeIdentNotary = require("./ast").IodeIdentNotary,
	IodeArray = require("./ast").IodeArray,
	IodeArrayIndex = require("./ast").IodeArrayIndex,
	IodeRange = require("./ast").IodeRange,
	IodeMassVariableDeclaration = require("./ast").IodeMassVariableDeclaration,
	IodeMassVariableSetting = require("./ast").IodeMassVariableSetting,
	IodeFor = require("./ast").IodeFor,
	IodeNumberPlusMinus = require("./ast").IodeNumberPlusMinus,
	IodeEmptyVariable = require("./ast").IodeEmptyVariable,
	IodeEmptyMassVariable = require("./ast").IodeEmptyMassVariable,
	IodeClass = require("./ast").IodeClass,
	IodePercentage = require("./ast").IodePercentage,
	IodeRepeat = require("./ast").IodeRepeat,
	IodePattern = require("./ast").IodePattern,
	IodeJSON = require("./ast").IodeJSON,
	IodeNamespace = require("./ast").IodeNamespace,
	IodeTry = require("./ast").IodeTry,
	IodeEmbedded = require("./ast").IodeEmbedded,
	IodeVariableSetting = require("./ast").IodeVariableSetting;

var Parser = function(code, cdir) {
	this.lexer = new Lexer(code);
	this.code = code;
	this.pos = 0;
	this.line = 1;
	this.cdir = cdir;
	this.totalTokens = this.lexer.tokens.length;
	this.constants = [];

	this.peekToken = function() {
		return this.lexer.peekToken();
	};

	this.peekCheck = function(t) {
		if (this.peekToken() == undefined) {
			return null;
		}
		return this.peekToken().type == t;
	};

	this.peekSpecificCheck = function(t, i) {
		if (this.peekSpecificToken(i) == undefined) {
			return null;
		}
		return this.peekSpecificToken(i).type == t;
	};

	this.peekSpecificToken = function(i) {
		return this.lexer.peekSpecificToken(i);
	};

	this.skipNewline = function() {
		if (this.peekCheck(TokenType.NEWLINE)) {
			this.nextToken();
		}
	};

	this.nextToken = function() {
		this.pos++;

		if (this.peekToken().type == TokenType.NEWLINE) {
			this.line++;
		}

		return this.lexer.nextToken();
	};

	this.nextTokenNewline = function() {
		this.pos++;

		if (this.peekToken().type == TokenType.NEWLINE) {
			this.line++;
		}

		var tok = this.lexer.nextToken();

		if (this.peekCheck(TokenType.NEWLINE)) {
			this.nextToken();
		}

		return tok;
	};

	this.isValidType = function(type) {
		return type == "number" || type == "string" ||
					 type == "boolean" || type == "undefined" ||
					 type == "object" || type == "function";
	};

	this.error = function(msg) {
		console.log();
		console.log("[x] " + msg + " on line #" + this.line + ".");
		console.log();
		process.exit(1);
	};

	this.warning = function(msg) {
		console.log();
		console.log("[!] " + msg + " on line #" + this.line + ".");
		console.log();
	};

	this.isNumberOperator = function() {
		return (
			this.peekCheck(TokenType.ADD) ||
			this.peekCheck(TokenType.SUB) ||
			this.peekCheck(TokenType.MUL) ||
			this.peekCheck(TokenType.DIV) ||
			this.peekCheck(TokenType.EXP) ||
			this.peekCheck(TokenType.GT) ||
			this.peekCheck(TokenType.LT) ||
			this.peekCheck(TokenType.GTEQUALS) ||
			this.peekCheck(TokenType.LTEQUALS) ||
			this.peekCheck(TokenType.IS) ||
			this.peekCheck(TokenType.NEQUALS) ||
			this.peekCheck(TokenType.MODULUS) ||
			this.peekCheck(TokenType.SUBSUB) ||
			this.peekCheck(TokenType.PLUSPLUS)
		);
	};

	this.isStringOperator = function() {
		return (
			this.peekCheck(TokenType.ADD) ||
			this.peekCheck(TokenType.GT) ||
			this.peekCheck(TokenType.LT) ||
			this.peekCheck(TokenType.GTEQUALS) ||
			this.peekCheck(TokenType.LTEQUALS) ||
			this.peekCheck(TokenType.IS) ||
			this.peekCheck(TokenType.NEQUALS)
		);
	};

	this.isIdentOperator = function() {
		return (
			this.peekSpecificCheck(TokenType.ADD, 2) ||
			this.peekSpecificCheck(TokenType.SUB, 2) ||
			this.peekSpecificCheck(TokenType.MUL, 2) ||
			this.peekSpecificCheck(TokenType.DIV, 2) ||
			this.peekSpecificCheck(TokenType.GT, 2) ||
			this.peekSpecificCheck(TokenType.LT, 2) ||
			this.peekSpecificCheck(TokenType.GTEQUALS, 2) ||
			this.peekSpecificCheck(TokenType.LTEQUALS, 2) ||
			this.peekSpecificCheck(TokenType.IS, 2) ||
			this.peekSpecificCheck(TokenType.NEQUALS, 2) ||
			this.peekSpecificCheck(TokenType.MODULUS, 2)
		);
	};

	// [0-9]+
	this.parseNumber = function() {
		var num = new IodeNumber(this.nextToken().value);
		this.skipNewline();

		if (this.peekCheck(TokenType.PERCENT)) {
      this.nextTokenNewline();

			num = new IodePercentage(num.val)
		}

		var op;
		var right;

		if (this.peekCheck(TokenType.SUBSUB) || this.peekCheck(TokenType.PLUSPLUS)) {
			var op = this.nextToken().value;
			this.skipNewline();
			return new IodeNumberPlusMinus(num, op);
		}

		if (!this.isNumberOperator()) {
			return num;
		}

		while (this.isNumberOperator()) {
			op = this.nextToken().value;
			this.skipNewline();
			right = this.parseNextLiteral();
			this.skipNewline();
		}

		num = new IodeBinaryOp(num, op, right);

		if (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
			while (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
				op = this.nextToken().value;
				this.skipNewline();
				right = this.parseNextLiteral();
				this.skipNewline();
				num = new IodeBinaryOp(num, op, right);
			}
		}

		return num;
	};

	// """ .* """
	this.parseString = function() {
		var str = new IodeString(this.nextToken().value);
		this.skipNewline();
		var op;
		var right;

		if (!this.isStringOperator()) {

			return str;
		}

		while (this.isStringOperator()) {
			op = this.nextToken().value;

			this.skipNewline();
			right = this.parseNextLiteral();
			this.skipNewline();
		}

		var num = new IodeBinaryOp(str, op, right);

		if (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
			while (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
				op = this.nextToken().value;
				this.skipNewline();
				right = this.parseNextLiteral();
				this.skipNewline();
				num = new IodeBinaryOp(num, op, right);
			}
		}

		return num;
	};

	// true / false / nil / undefined
	this.parseBoolean = function() {
		var bool = new IodeBoolean(this.nextToken().value);
		this.skipNewline();
		var op;
		var right;

		if (!(this.peekCheck(TokenType.IS) || this.peekCheck(TokenType.NEQUALS) || this.peekCheck(TokenType.MODULUS))) {
			return bool;
		}

		while (this.peekCheck(TokenType.IS) || this.peekCheck(TokenType.NEQUALS) || this.peekCheck(TokenType.MODULUS)) {
			op = this.nextToken().value;
			this.skipNewline();
			right = this.parseNextLiteral();
			this.skipNewline();
		}

		var num = new IodeBinaryOp(bool, op, right);

		if (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
			while (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
				op = this.nextToken().value;
				this.skipNewline();
				right = this.parseNextLiteral();
				this.skipNewline();
				num = new IodeBinaryOp(num, op, right);
			}
		}

		return num;
	};

	// [a-zA-Z][a-zA-Z0-9]*
	this.parseIdentifier = function() {
		if (this.isIdentOperator()) {

			var ident = new IodeIdentifier(this.nextToken().value);
			this.skipNewline();
			var op;
			var right;

			while (this.isIdentOperator()) {

				op = this.nextToken().value;
				this.skipNewline();
				right = this.parseNextLiteral();
				this.skipNewline();
			}

			var num = new IodeBinaryOp(ident, op, right);

			if (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
				while (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
					op = this.nextToken().value;
					this.skipNewline();
					right = this.parseNextLiteral();
					this.skipNewline();
					num = new IodeBinaryOp(num, op, right);
				}
			}

			return num;
		} else if (this.peekSpecificCheck(TokenType.EQUALS, 2)) {
			return this.parseVariableSetting();
		} else if (this.peekSpecificCheck(TokenType.SUBSUB, 2)
				|| this.peekSpecificCheck(TokenType.PLUSPLUS, 2)) {
			var ident = new IodeIdentifier(this.nextToken().value);
			this.skipNewline();
			var op = this.nextToken().value;
			this.skipNewline();
			return new IodeNumberPlusMinus(ident, op)
		} else if (this.peekSpecificCheck(TokenType.QUESTION, 2)) {
			var ident = new IodeIdentifier(this.nextToken().value);
			this.nextTokenNewline();
			var expr1 = this.parseNextLiteral();

			if (this.peekCheck(TokenType.COLON)) {
				this.skipNewline();
				this.nextToken();
				var expr2 = this.parseNextLiteral();
				return new IodeIdentNotary(ident, expr1, expr2);
			} else {
				this.error("Expected \":\" after first expression");
			}
		} else if (this.peekSpecificCheck(TokenType.LBRACK, 2)) {
			var ident = new IodeIdentifier(this.nextToken().value);
			this.nextTokenNewline();
			var expr = this.parseNextLiteral();
			this.skipNewline();

			if (this.peekCheck(TokenType.RBRACK)) {
				this.nextToken();
				return new IodeArrayIndex(ident, expr);
			} else {
				this.error("Expected \"]\" at the end of array index");
			}
		} else if (this.peekSpecificCheck(TokenType.LPAREN, 2)) {
			var name = this.nextToken().value;
			this.nextTokenNewline();
			var args = [];

			while (!(this.peekCheck(TokenType.RPAREN))) {
				var arg = this.parseNext().val;
				this.skipNewline();

				if (arg.charAt(arg.length - 1) == ";") {
					arg = arg.substring(0, arg.length - 1);
				}

				args.push(arg);

				if (this.peekCheck(TokenType.COMMA)) {
          this.nextTokenNewline();
				} else if (this.peekCheck(TokenType.RPAREN)) {
					break;
				} else {
					this.error("Expected a \",\" or \")\", got \"" + this.peekToken().value +
						"\"");
				}
			}

			if (this.peekCheck(TokenType.RPAREN)) {
				this.nextToken();
			} else {
				this.error("Expected a \")\", got \"" + this.peekToken().value + "\"");
			}

			var calls = [new IodeCall(name, args).val];

			if (this.peekCheck(TokenType.DOT)) {
				this.skipNewline();

				while (this.peekCheck(TokenType.DOT)) {
          this.nextTokenNewline();
					calls.push(this.parseNextLiteral().val);
				}

				var call = new IodeCallList(calls);

				if (this.isNumberOperator()) {

					this.skipNewline();
					var op;
					var right;

					while (this.isNumberOperator()) {

						op = this.nextToken().value;
						this.skipNewline();
						right = this.parseNextLiteral();
						this.skipNewline();
					}

					call = new IodeBinaryOp(call, op, right);

					if (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
						while (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
							op = this.nextToken().value;
							this.skipNewline();
							right = this.parseNextLiteral();
							this.skipNewline();
							call = new IodeBinaryOp(call, op, right);
						}
					}
				} else {
					if (this.peekToken() != undefined) {
						if (this.peekCheck(TokenType.NEWLINE)) {
							this.nextToken();
							this.skipNewline();
						} else if (this.peekCheck(TokenType.QUESTION)) {
							this.nextToken();

							var expr1 = this.parseNextLiteral();

							if (this.peekCheck(TokenType.COLON)) {
								this.skipNewline();
								this.nextToken();
								var expr2 = this.parseNextLiteral();
								call = new IodeIdentNotary(call, expr1, expr2);
							} else {
								this.error("Expected \":\" after first expression");
							}
						} else if (this.peekCheck(TokenType.LBRACK)) {
							var ident = new IodeIdentifier(this.nextToken().value);
							this.skipNewline();
							this.nextToken();
							var expr = this.parseNextLiteral();
							this.skipNewline();

							if (this.peekCheck(TokenType.RBRACK)) {
								this.nextToken();
								call = new IodeArrayIndex(ident, expr);
							} else {
								this.error("Expected \"]\" at the end of array index");
							}
						} else if (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
							call = new IodeBinaryOp(call, op, right);

							while (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
								op = this.nextToken().value;
								this.skipNewline();
								right = this.parseNextLiteral();
								this.skipNewline();
							}

							return call;
						} else {
							return call;
						}
					} else {
						this.error("Expected newline");
					}
				}

				return call;
			} else {
				if (this.peekToken() == undefined) {
					this.error("Expected newline");
				}

				var call_ = new IodeCall(name, args);

				if (this.isNumberOperator()) {

					this.skipNewline();
					var op;
					var right;

					while (this.isNumberOperator()) {

						op = this.nextToken().value;
						this.skipNewline();
						right = this.parseNextLiteral();
						this.skipNewline();
					}

					call_ = new IodeBinaryOp(call_, op, right);

					if (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
						while (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
							op = this.nextToken().value;
							this.skipNewline();
							right = this.parseNextLiteral();
							this.skipNewline();
							call_ = new IodeBinaryOp(call_, op, right);
						}
					}
				} else if (this.peekCheck(TokenType.QUESTION)) {
					this.nextToken();

					var expr1 = this.parseNextLiteral();

					if (this.peekCheck(TokenType.COLON)) {
						this.skipNewline();
						this.nextToken();
						var expr2 = this.parseNextLiteral();
						call_ = new IodeIdentNotary(call_, expr1, expr2);
					} else {
						this.error("Expected \":\" after first expression");
					}
				} else if (this.peekCheck(TokenType.LBRACK)) {
					var ident = new IodeIdentifier(this.nextToken().value);
					this.skipNewline();
					this.nextToken();
					var expr = this.parseNextLiteral();
					this.skipNewline();

					if (this.peekCheck(TokenType.RBRACK)) {
						this.nextToken();
						call_ = new IodeArrayIndex(ident, expr);
					} else {
						this.error("Expected \"]\" at the end of array index");
					}
				}

				return call_;
			}
		} else {
			var ident = new IodeIdentifier(this.nextToken().value);
			var calls = [ident.val];

			if (this.peekCheck(TokenType.DOT)) {
				while (this.peekCheck(TokenType.DOT)) {
          this.nextTokenNewline();
					calls.push(this.parseNextLiteral().val);
				}

				ident = new IodeCallList(calls);
			}

			var num = new IodeBinaryOp(ident, op, right);

			if (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
				while (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
					op = this.nextToken().value;
					this.skipNewline();
					right = this.parseNextLiteral();
					this.skipNewline();
					num = new IodeBinaryOp(num, op, right);
				}
			} else {
				return ident;
			}

			return num;
		}
	};

	// var ident "=" expr
	this.parseVariableDeclaration = function() {
    this.nextTokenNewline();
		var expectedType = null;

		if (this.peekCheck(TokenType.IDENTIFIER)) {
			var name = this.nextToken().value;

			if (this.constants.indexOf(name) > -1) {
				this.warning("\"" + name +
					"\" is already defined as a constant and the value won\"t be changed");
			}

			if (this.peekCheck(TokenType.COLON)) {
				this.nextTokenNewline();

				if (this.peekCheck(TokenType.IDENTIFIER)) {
					var type = this.nextToken().value;

					if (this.isValidType(type.toLowerCase())) {
						expectedType = type.toLowerCase();
					} else {
						this.error("Unknown type: \"" + type.value + "\"");
					}
				}
			}

			if (this.peekCheck(TokenType.EQUALS)) {
				this.skipNewline();
	      this.nextTokenNewline();
				var oldLine = this.line;

				var val = this.parseNextLiteral();

				if (this.peekCheck(TokenType.NEWLINE)) {
          this.nextTokenNewline();
				} else if (this.line > oldLine) {
					return new IodeVariableDeclaration(name, val, expectedType);
				} else {
					this.error("Expected a newline");
				}

				return new IodeVariableDeclaration(name, val, expectedType);
			} else if (this.peekCheck(TokenType.NEWLINE)) {
	      this.nextTokenNewline();
				return new IodeEmptyVariable(name);
			} else {
				this.error("Expected \"=\" or a newline, got \"" + this.peekToken().value + "\"");
			}
		} else if (this.peekCheck(TokenType.LBRACK)) {
			return this.parseArray(true);
		} else {
			this.error("Expected a variable name, got \"" + this.peekToken().value +
				"\"");
		}
	};

	// "const" ident "=" expr
	this.parseConst = function() {
    this.nextTokenNewline();

		if (this.peekCheck(TokenType.IDENTIFIER)) {
			var name = this.nextToken().value;

			if (this.constants.indexOf(name) > -1) {
				this.warning("\"" + name +
					"\" is already defined and the value won\"t be changed");
			}

			this.skipNewline();

			if (this.peekCheck(TokenType.EQUALS)) {
	      this.nextTokenNewline();
				var oldLine = this.line;

				var val = this.parseNextLiteral();

				if (this.peekCheck(TokenType.NEWLINE)) {
          this.nextTokenNewline();
				} else if (this.line > oldLine) {
					this.constants.push(name);
					return new IodeConstant(name, val);
				} else {
					this.error("Expected a newline");
				}

				this.constants.push(name);
				return new IodeConstant(name, val);
			} else {
				this.error("Expected \"=\", got \"" + this.peekToken().value + "\"");
			}
		} else {
			this.error("Expected a variable name, got \"" + this.peekToken().value +
				"\"");
		}
	};

	// ident "=" expr
	this.parseVariableSetting = function() {
		var name = this.nextToken().value;

		if (this.constants.indexOf(name) > -1) {
			this.warning("\"" + name +
				"\" is a constant variable and the value won\"t be changed");
		}

		this.skipNewline();

		if (this.peekCheck(TokenType.EQUALS)) {
      this.nextTokenNewline();
			var oldLine = this.line;

			var val = this.parseNextLiteral();

			if (this.peekCheck(TokenType.NEWLINE)) {
	      this.nextTokenNewline();
			} else if (this.line > oldLine) {
				return new IodeVariableSetting(name, val);
			} else if (this.peekCheck(TokenType.RPAREN) || this.peekCheck(TokenType.COMMA)) {
				return new IodeVariableSetting(name, val);
			} else {
				this.error("Expected a newline");
			}

			return new IodeVariableSetting(name, val);
		} else {
			this.error("Expected \"=\", got \"" + this.peekToken().value + "\"");
		}
	};

	// fn name (expr?)* { ... }
	this.parseFunction = function() {
    this.nextTokenNewline();
		var lbrace = false;

		if (this.peekCheck(TokenType.IDENTIFIER)) {
			var name = this.nextToken().value;
			this.skipNewline();
			var args = [];
			var originalArgs = [];
			var body = [];

			if (this.peekCheck(TokenType.LPAREN)) {
	      this.nextTokenNewline();

				while (!(this.peekCheck(TokenType.RPAREN))) {
					var arg = this.parseNext();
					var expectedType = null;
					this.skipNewline();

					if (this.peekCheck(TokenType.COLON)) {
						this.nextTokenNewline();

						if (this.peekCheck(TokenType.IDENTIFIER)) {
							var type = this.nextToken().value;
							this.skipNewline();

							if (this.isValidType(type.toLowerCase())) {
								expectedType = type.toLowerCase();
							} else {
								this.error("Unknown type: \"" + type.value + "\"");
							}
						}
					}

					originalArgs.push(arg);
					args.push({ it: arg, expecting: expectedType });

					if (!(this.peekCheck(TokenType.COMMA) || this.peekCheck(TokenType.RPAREN))) {
						this.error("Expected a \",\" or \"{\", got \"" + this.peekToken().value +
							"\"");
					} else if (this.peekCheck(TokenType.RPAREN)) {
						break;
					} else {
						this.nextTokenNewline();
					}
				}
			} else if (this.peekCheck(TokenType.LBRACE)) {
				lbrace = true;
				this.nextTokenNewline();
			} else {
				this.error("Expected a \"(\" or a \"{\", got \"" + this.peekToken().value + "\"");
			}

			if (!lbrace) {
				if (this.peekCheck(TokenType.RPAREN) || lbrace) {
		      this.nextTokenNewline();
				} else if (this.peekCheck(TokenType.LBRACE) || lbrace) {
		      this.nextTokenNewline();
				} else {
					this.error("Expected a \")\" or a \"{\", got \"" + this.peekToken().value + "\"");
				}
			}

			if (this.peekCheck(TokenType.COLON)) {
				this.nextToken();
				this.skipNewline();

				if (this.peekCheck(TokenType.IDENTIFIER)) {
					var proto = this.nextToken().value;
					this.skipNewline();

					if (this.peekCheck(TokenType.LBRACE)) {
						this.nextTokenNewline();
					} else {
						this.error("Expected a \"{\"");
					}

					while (!(this.peekCheck(TokenType.RBRACE))) {
						var stmt = this.parseNext();
						this.skipNewline();

						body.push(stmt);

						if (this.peekCheck(TokenType.NEWLINE)) {
		          this.nextTokenNewline();
						} else if (this.peekCheck(TokenType.RBRACE)) {
							break;
						}
					}

					if (this.peekCheck(TokenType.RBRACE)) {
			      this.nextTokenNewline();
					} else {
						this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
					}

					return new IodePrototype(name, proto, originalArgs, body);
				} else {
					this.error("Expected an identifier, got \"" + this.peekToken().value + "\"");
				}
			} else if (this.peekCheck(TokenType.LBRACE) || lbrace) {
				if (!lbrace) {
					this.nextTokenNewline();
				}

				while (!(this.peekCheck(TokenType.RBRACE))) {
					var stmt = this.parseNext();
					this.skipNewline();

					body.push(stmt);

					if (this.peekCheck(TokenType.NEWLINE)) {
	          this.nextTokenNewline();
						this.error("Expected a newline, got \"" + this.peekToken().value +
							"\"");
					} else if (this.peekCheck(TokenType.RBRACE)) {
						break;
					}
				}

				if (this.peekCheck(TokenType.RBRACE)) {
		      this.nextTokenNewline();
				} else {
					this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
				}

				return new IodeFunction(name, args, body);
			} else {
				this.error("Expected a \"{\" or a \"::\", got \"" + this.peekToken().value + "\"");
			}
		} else if (this.peekCheck(TokenType.ARROW)) {
	      this.nextTokenNewline();
				var args = [];

				if (this.peekCheck(TokenType.LPAREN)) {
          this.nextTokenNewline();
				} else {
					this.error("Expected a \"(\", got a \"" + this.peekToken().value + "\"");
				}

				while (!(this.peekCheck(TokenType.RPAREN))) {
					var arg = this.parseNextLiteral().val;
					this.skipNewline();

					if (arg.charAt(arg.length - 1) == ";") {
						arg = arg.substring(0, arg.length - 1);
					}

					args.push(arg);

					if (!(this.peekCheck(TokenType.COMMA) || this.peekCheck(TokenType.RPAREN))) {
						this.error("Expected a \",\" or \")\", got \"" + this.peekToken().value +
							"\"");
					} else if (this.peekCheck(TokenType.RPAREN)) {
						break;
					} else {
						this.nextTokenNewline();
					}
				}

				if (this.peekCheck(TokenType.RPAREN)) {
          this.nextTokenNewline();
				}

				var body = [new IodeReturn(this.parseNextLiteral())];

				if (this.peekCheck(TokenType.NEWLINE)) {
          this.nextTokenNewline();
				} else {
					this.error("Expected a newline, got \"" + this.peekToken().value + "\"");
				}

				return new IodeFunction("", args, body);
		} else if (this.peekCheck(TokenType.LBRACE)) {
			var body = [];

      this.nextTokenNewline();

			while (!(this.peekCheck(TokenType.RBRACE))) {
				var stmt = this.parseNext();
				this.skipNewline();

				body.push(stmt);

				if (this.peekCheck(TokenType.NEWLINE)) {
          this.nextTokenNewline();
					this.error("Expected a newline, got \"" + this.peekToken().value +
						"\"");
				} else if (this.peekCheck(TokenType.RBRACE)) {
					break;
				}
			}

			if (this.peekCheck(TokenType.RBRACE)) {
	      this.nextTokenNewline();
			} else {
				this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
			}

			return new IodeFunction("", [], body);
		} else if (this.peekCheck(TokenType.LPAREN)) {
      this.nextTokenNewline();
			var args = [];
			var body = [];

			while (!(this.peekCheck(TokenType.LBRACE))) {
				var arg = this.parseNextLiteral().val;
				this.skipNewline();

				if (arg.charAt(arg.length - 1) == ";") {
					arg = arg.substring(0, arg.length - 1);
				}

				args.push(arg);

				if (!(this.peekCheck(TokenType.COMMA) || this.peekCheck(TokenType.RPAREN))) {
					this.error("Expected a \",\" or \")\", got \"" + this.peekToken().value +
						"\"");
				} else if (this.peekCheck(TokenType.RPAREN)) {
					break;
				} else {
          this.nextTokenNewline();
				}
			}

			if (this.peekCheck(TokenType.RPAREN)) {
	      this.nextTokenNewline();
			} else {
				this.error("Expected a \")\", got \"" + this.peekToken().value + "\"");
			}

			if (this.peekCheck(TokenType.LBRACE)) {
	      this.nextTokenNewline();
			} else {
				this.error("Expected a \"{\", got \"" + this.peekToken().value + "\"");
			}

			while (!(this.peekCheck(TokenType.RBRACE))) {
				var stmt = this.parseNext();
				this.skipNewline();

				body.push(stmt);

				if (this.peekCheck(TokenType.NEWLINE)) {
          this.nextTokenNewline();
					this.error("Expected a newline, got \"" + this.peekToken().value +
						"\"");
				} else if (this.peekCheck(TokenType.RBRACE)) {
					break;
				}
			}

			if (this.peekCheck(TokenType.RBRACE)) {
	      this.nextTokenNewline();
			} else {
				this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
			}

			return new IodeFunction("", args, body);
		} else {
			this.error("Expected a function name, got \"" + this.peekToken().value +
				"\"");
		}
	};

	this.parseParenthesis = function() {
    this.nextTokenNewline();
		var val = this.parseNextLiteral();
		this.skipNewline();

		if (!(this.peekCheck(TokenType.RPAREN))) {
			this.error("Expected a \")\", got \"" + this.peekToken().value + "\"");
		}

    this.nextTokenNewline();
		var paren = new IodeParenthesis(val);
		var op;
		var right;

		if (!this.isNumberOperator()) {
			return paren;
		}

		while (this.isNumberOperator()) {
			op = this.nextToken().value;
			this.skipNewline();
			right = this.parseNextLiteral();
			this.skipNewline();
		}

		if (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
			while (this.peekCheck(TokenType.AND) || this.peekCheck(TokenType.OR)) {
				op = this.nextToken().value;
				this.skipNewline();
				var right = this.parseNextLiteral();
				this.skipNewline();
			}

			return new IodeBinaryOp(paren, op, right);
		} else {
			return new IodeBinaryOp(paren, op, right);
		}
	};

	this.parseIf = function() {
    this.nextTokenNewline();
		var body = [];
		var args = this.parseNextLiteral();
		this.skipNewline();

		if (this.peekCheck(TokenType.LBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"{\", got \"" + this.peekToken().value + "\"");
		}

		while (!(this.peekCheck(TokenType.RBRACE))) {
			var stmt = this.parseNext();
			this.skipNewline();

			body.push(stmt);

			if (this.peekCheck(TokenType.NEWLINE)) {
	      this.nextTokenNewline();
				this.error("Expected a newline, got \"" + this.peekToken().value +
					"\"");
			} else if (this.peekCheck(TokenType.RBRACE)) {
				break;
			}
		}

		if (this.peekCheck(TokenType.RBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
		}

		if (this.peekCheck(TokenType.ELSIF) || this.peekCheck(TokenType.ELSE)) {
			var chained = [new IodeIf(args, body)];
			this.skipNewline();

			while (this.peekCheck(TokenType.ELSIF) || this.peekCheck(TokenType.ELSE)) {
				var Else;

				if (this.peekCheck(TokenType.ELSE)) {
					Else = true;
				} else {
					Else = false;

					for (var chain in chained) {
						if (chained[chain].type == "Else") {
							this.error("Unexpected ElsIF, If chain already has an Else block");
						}
					}
				}

	      this.nextTokenNewline();
				var body_ = [];
				var args_ = null;

				if (!Else) {
					args_ = this.parseNextLiteral();
				}

				this.skipNewline();

				if (this.peekCheck(TokenType.LBRACE)) {
          this.nextTokenNewline();
				} else {
					this.error("Expected a \"{\", got \"" + this.peekToken().value + "\"");
				}

				while (!(this.peekCheck(TokenType.RBRACE))) {
					var stmt = this.parseNext();
					this.skipNewline();

					body_.push(stmt);

					if (this.peekCheck(TokenType.NEWLINE)) {
						this.nextTokenNewline();
						this.error("Expected a newline, got \"" + this.peekToken().value +
							"\"");
					} else if (this.peekCheck(TokenType.RBRACE)) {
						break;
					}
				}

				if (this.peekCheck(TokenType.RBRACE)) {
          this.nextTokenNewline();
				} else {
					this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
				}

				if (Else) {
					chained.push(new IodeElse(body_));
				} else {
					chained.push(new IodeElsIf(args_, body_));
				}
			}

			return new IodeIfChain(chained);
		} else {
			return new IodeIf(args, body);
		}
	};

	this.parseWhile = function() {
    this.nextTokenNewline();
		var body = [];
		var args = this.parseNextLiteral();
		this.skipNewline();

		if (this.peekCheck(TokenType.LBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"{\", got \"" + this.peekToken().value + "\"");
		}

		while (!(this.peekCheck(TokenType.RBRACE))) {
			var stmt = this.parseNext();
			this.skipNewline();

			body.push(stmt);

			if (this.peekCheck(TokenType.NEWLINE)) {
	      this.nextTokenNewline();
				this.error("Expected a newline, got \"" + this.peekToken().value +
					"\"");
			} else if (this.peekCheck(TokenType.RBRACE)) {
				break;
			}
		}

		if (this.peekCheck(TokenType.RBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
		}

		return new IodeWhile(args, body);
	};

	this.parseRepeat = function() {
    this.nextTokenNewline();
		var body = [];
		var args = this.parseNextLiteral();
		this.skipNewline();

		if (this.peekCheck(TokenType.LBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"{\", got \"" + this.peekToken().value + "\"");
		}

		while (!(this.peekCheck(TokenType.RBRACE))) {
			var stmt = this.parseNext();
			this.skipNewline();

			body.push(stmt);

			if (this.peekCheck(TokenType.NEWLINE)) {
	      this.nextTokenNewline();
				this.error("Expected a newline, got \"" + this.peekToken().value +
					"\"");
			} else if (this.peekCheck(TokenType.RBRACE)) {
				break;
			}
		}

		if (this.peekCheck(TokenType.RBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
		}

		return new IodeRepeat(args, body);
	};

	this.parseUntil = function() {
    this.nextTokenNewline();
		var body = [];
		var args = this.parseNextLiteral();
		this.skipNewline();

		if (this.peekCheck(TokenType.LBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"{\", got \"" + this.peekToken().value + "\"");
		}

		while (!(this.peekCheck(TokenType.RBRACE))) {
			var stmt = this.parseNext();
			this.skipNewline();

			body.push(stmt);

			if (this.peekCheck(TokenType.NEWLINE)) {
	      this.nextTokenNewline();
				this.error("Expected a newline, got \"" + this.peekToken().value +
					"\"");
			} else if (this.peekCheck(TokenType.RBRACE)) {
				break;
			}
		}

		if (this.peekCheck(TokenType.RBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
		}

		return new IodeUntil(args, body);
	};

	this.parseForeach = function() {
    this.nextTokenNewline();
		var body = [];
		var val, arr;

		if (this.peekSpecificCheck(TokenType.IN, 2)) {
			val = this.parseNextLiteral();
			this.nextToken();
			arr = this.parseNextLiteral();
		}

		this.skipNewline();

		if (this.peekCheck(TokenType.LBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"{\", got \"" + this.peekToken().value + "\"");
		}

		while (!(this.peekCheck(TokenType.RBRACE))) {
			var stmt = this.parseNext();
			this.skipNewline();

			body.push(stmt);

			if (this.peekCheck(TokenType.NEWLINE)) {
	      this.nextTokenNewline();
				this.error("Expected a newline, got \"" + this.peekToken().value +
					"\"");
			} else if (this.peekCheck(TokenType.RBRACE)) {
				break;
			}
		}

		if (this.peekCheck(TokenType.RBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
		}

		return new IodeForeach(val, arr, body);
	};

	this.parseReturn = function() {
		this.nextToken();

		if (this.peekCheck(TokenType.NEWLINE)) {
			return new IodeReturn(null);
		} else {
			this.skipNewline();
			return new IodeReturn(this.parseNextLiteral());
		}
	};

	this.parseContinue = function() {
		this.nextToken();

		if (this.peekCheck(TokenType.NEWLINE)) {
			return new IodeContinue(null);
		} else {
			this.skipNewline();
			return new IodeContinue(this.parseNextLiteral());
		}
	};

	this.parseThrow = function() {
		this.nextToken();

		if (this.peekCheck(TokenType.NEWLINE)) {
			this.error("Expecting an error message");
			return null;
		} else {
			this.skipNewline();
			return new IodeThrow(this.parseNextLiteral());
		}
	};

	this.parseNot = function() {
    this.nextTokenNewline();
		var ret = new IodeNot(this.parseNextLiteral());
		this.skipNewline();
		return ret;
	};

	this.parseNew = function() {
    this.nextTokenNewline();
		var ret = new IodeNew(this.parseNextLiteral());
		this.skipNewline();
		return ret;
	};

	this.parseInclude = function() {
    this.nextTokenNewline();

		if (this.peekCheck(TokenType.STRING)) {
			var str = this.nextToken().value;
			str.substring(1, str.length - 1);

			var filename = path.join(this.cdir, str);
			var code = "/* imported: " + str + " */\n";

			try {
				code = fs.readFileSync(filename) + "\n";
			} catch (e) {
				if (e.code === "ENOENT") {
					this.error("File not found");
				} else {
					this.error("An error occured importing a file");
				}
			}

			var parser = new Parser(code.toString());
			var ast = parser.parse();
			var outputCode = "";

			try {
				for (var expr in ast) {
					outputCode += "\n" + ast[expr].val;
				}
			} catch (e) {
				this.error("Could not read file");
			}

			var ret = new IodeInclude(outputCode);

			if (this.peekCheck(TokenType.NEWLINE)) {
	      this.nextTokenNewline();
				return ret;
			} else {
				this.error("Expected a newline");
			}
		} else {
			this.error("Expected a string in import, got a \"" + this.peekToken().type + "\"");
		}
	};

	this.parseArray = function(isVar) {
    this.nextTokenNewline();

		if (this.peekSpecificCheck(TokenType.TWODOTS, 2)) {
			var num1 = this.parseNextLiteral();
			this.skipNewline();
      this.nextTokenNewline();
			var num2 = this.parseNextLiteral();
			this.skipNewline();

			if (this.peekCheck(TokenType.RBRACK)) {
	      this.nextTokenNewline();
			} else {
				this.error("Expected \"]\", got \"" + this.peekToken().type + "\"");
			}

			return new IodeRange(num1, num2);
		} else {
			var args = [];

			while (!(this.peekCheck(TokenType.RBRACK))) {
				var arg = this.parseNextLiteral().val;
				this.skipNewline();

				if (arg.charAt(arg.length - 1) == ";") {
					arg = arg.substring(0, arg.length - 1);
				}

				args.push(arg);

				if (!(this.peekCheck(TokenType.COMMA) || this.peekCheck(TokenType.RBRACK))) {
					this.error("Expected a \",\" or \"]\", got \"" + this.peekToken().value +
						"\"");
				} else if (this.peekCheck(TokenType.RBRACK)) {
					break;
				} else {
          this.nextTokenNewline();
				}
			}

			if (this.peekCheck(TokenType.RBRACK)) {
	      this.nextTokenNewline();
			} else {
				this.error("Expected a \"]\", got \"" + this.peekToken().value + "\"");
			}

			if (this.peekCheck(TokenType.EQUALS) && isVar) {
				var arr1 = new IodeArray(args);
	      this.nextTokenNewline();
				var oldLine = this.line;
				var arr2 = [];

				if (this.peekCheck(TokenType.LBRACK)) {
					arr2 = this.parseArray(false);
				} else {
					this.error("Expected an \"[\" in mass variable declaration");
				}

				if (this.peekCheck(TokenType.NEWLINE)) {
          this.nextTokenNewline();
				} else if (this.line > oldLine) {
					this.skipNewline();
					return new IodeMassVariableDeclaration(arr1, arr2);
				} else {
					this.error("Expected a newline");
				}

				this.skipNewline();
				return new IodeMassVariableDeclaration(arr1, arr2);
			} else if (this.peekCheck(TokenType.EQUALS)) {
				if (this.peekCheck(TokenType.EQUALS)) {
					var arr1 = new IodeArray(args);
          this.nextTokenNewline();
					var oldLine = this.line;
					var arr2 = [];

					if (this.peekCheck(TokenType.LBRACK)) {
						arr2 = this.parseArray(false);
					} else {
						this.error("Expected an \"[\" in mass variable setting");
					}

					if (this.peekCheck(TokenType.NEWLINE)) {
						this.nextTokenNewline();
					} else if (this.line > oldLine) {
						this.skipNewline();
						return new IodeMassVariableSetting(arr1, arr2);
					} else {
						this.error("Expected a newline");
					}

					this.skipNewline();
					return new IodeMassVariableSetting(arr1, arr2);
				} else {
					return new IodeArray(args);
				}
			} else {
				return new IodeArray(args);
			}
		}
	};

	this.parseClass = function() {
    this.nextTokenNewline();
		var args = [];

		if (this.peekCheck(TokenType.IDENTIFIER)) {
			var name = this.parseNextLiteral().val;
			this.skipNewline();

			while (!(this.peekCheck(TokenType.LBRACE))) {
				var arg = this.parseNextLiteral().val;
				this.skipNewline();

				if (arg.charAt(arg.length - 1) == ";") {
					arg = arg.substring(0, arg.length - 1);
				}

				args.push(arg);

				if (!(this.peekCheck(TokenType.COMMA) || this.peekCheck(TokenType.LBRACE) || this.peekCheck(TokenType.EXTENDS))) {
					this.error("Expected a \",\" or \")\", got \"" + this.peekToken().value +
						"\"");
				} else if (this.peekCheck(TokenType.LBRACE) || this.peekCheck(TokenType.EXTENDS)) {
					break;
				} else {
          this.nextTokenNewline();
				}
			}

			var extended = null;

			if (this.peekCheck(TokenType.EXTENDS)) {
				this.nextTokenNewline();
				extended = this.nextToken().value;
				this.skipNewline();
			}

			if (this.peekCheck(TokenType.LBRACE)) {
	      this.nextTokenNewline();
				var body = [];

				while (!this.peekCheck(TokenType.RBRACE)) {
					var block = this.parseNextClass();
					this.skipNewline();

					if (block === null) {
						this.error("Class bodies may consist of functions and a constructor");
					}

					this.skipNewline();
					body.push(block);
				}

				if (this.peekCheck(TokenType.RBRACE)) {
          this.nextTokenNewline();
				} else {
					this.error("Expected a \"}\"");
				}
				
				return new IodeClass(name, args, body, extended);
			} else {
				this.error("Expected \"{\"");
			}
		} else {
			this.error("Expected a class name");
		}
	};

	this.parseFor = function() {
    this.nextTokenNewline();

		if (this.peekCheck(TokenType.LPAREN)) {
      this.nextTokenNewline();

			if (this.peekCheck(TokenType.IDENTIFIER)) {
				var name = this.nextToken().value;
				this.skipNewline();

				if (this.peekCheck(TokenType.EQUALS)) {
					this.nextToken();
					var val = this.parseNextLiteral();

					if (this.peekCheck(TokenType.COMMA)) {
						this.skipNewline();
						this.nextTokenNewline();
						var cond = this.parseNextLiteral();
						this.skipNewline();

						if (this.peekCheck(TokenType.COMMA)) {
							this.nextToken();
							this.skipNewline();
							var iter = this.parseNextLiteral();
							this.skipNewline();

							if (this.peekCheck(TokenType.RPAREN)) {
								this.nextToken();
								this.skipNewline();

								if (this.peekCheck(TokenType.LBRACE)) {
									this.nextToken();
									this.skipNewline();
									var body = [];

									while (!(this.peekCheck(TokenType.RBRACE))) {
										var stmt = this.parseNext();
										this.skipNewline();

										body.push(stmt);

										if (this.peekCheck(TokenType.NEWLINE)) {
											this.nextToken();
											this.skipNewline();
											this.error("Expected a newline, got \"" + this.peekToken().value +
												"\"");
										} else if (this.peekCheck(TokenType.RBRACE)) {
											break;
										}
									}

									if (this.peekCheck(TokenType.RBRACE)) {
										this.nextToken();
										this.skipNewline();
									} else {
										this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
									}

									return new IodeFor(name, val, cond, iter, body);
								} else {
									this.error("Expected a \"{\", got \"" + this.peekToken().type + "\"");
								}
							} else {
								this.error("Expected a \")\", got \"" + this.peekToken().type + "\"");
							}
						} else {
							this.error("Expected a \",\", got \"" + this.peekToken().type + "\"");
						}
					} else {
						this.error("Expected a \",\", got \"" + this.peekToken().type + "\"");
					}
				} else {
					this.error("Expected \"=\", got \"" + this.peekToken().type + "\"");
				}
			} else {
				this.error("Expected a variable name");
			}
		} else {
			this.error("Expected a \"(\", got \"" + this.peekToken().type + "\"");
		}
	};

	this.parseNewline = function() {
    this.nextTokenNewline();
		return new IodeNewline();
	};

	this.parsePattern = function() {
		var pattern = this.nextToken().value;
		this.skipNewline();
		return new IodePattern(pattern);
	};

	this.parseJSON = function() {
    this.nextTokenNewline();

		var elements = [];

		while (!this.peekCheck(TokenType.RBRACE)) {
			if (this.peekCheck(TokenType.STRING) || this.peekCheck(TokenType.IDENTIFIER)) {
				var a = this.parseNextLiteral().val;
				this.skipNewline();

				if (this.peekCheck(TokenType.COLON)) {
          this.nextTokenNewline();

					var b = this.parseNextLiteral().val;

					if (this.peekCheck(TokenType.COMMA)) {
						this.nextTokenNewline();
					} else if (this.peekCheck(TokenType.NEWLINE)) {
						this.skipNewline();
					} else if (this.peekCheck(TokenType.RBRACE)) {
						elements.push({left: a, right: b});
						this.nextTokenNewline();
						break;
					} else {
						this.error("Expected a comma or a newline");
					}

					elements.push({left: a, right: b});
				} else {
					this.error("Expected \":\"");
				}
			} else {
				this.error("Expected string or identifier before a \":\" in a JSON element");
			}
		}

		if (this.peekCheck(TokenType.RBRACE)) {
      this.nextTokenNewline();
		}

		return new IodeJSON(elements);
	};

	this.parseTry = function() {
    this.nextTokenNewline();
		var body = [];

		if (this.peekCheck(TokenType.LBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"{\", got \"" + this.peekToken().value + "\"");
		}

		while (!(this.peekCheck(TokenType.RBRACE))) {
			var stmt = this.parseNext();
			this.skipNewline();

			body.push(stmt);

			if (this.peekCheck(TokenType.NEWLINE)) {
	      this.nextTokenNewline();
				this.error("Expected a newline, got \"" + this.peekToken().value +
					"\"");
			} else if (this.peekCheck(TokenType.RBRACE)) {
				break;
			}
		}

		if (this.peekCheck(TokenType.RBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
		}

		if (this.peekCheck(TokenType.CATCH)) {
			this.nextTokenNewline();
		} else {
			this.error("Expected a \"catch\" statement");
		}

		var catchBody = [];
		var catchArgs = this.nextToken().value;
		this.skipNewline();

		if (this.peekCheck(TokenType.LBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"{\", got \"" + this.peekToken().value + "\"");
		}

		while (!(this.peekCheck(TokenType.RBRACE))) {
			var stmt = this.parseNext();
			this.skipNewline();

			catchBody.push(stmt);

			if (this.peekCheck(TokenType.NEWLINE)) {
	      this.nextTokenNewline();
				this.error("Expected a newline, got \"" + this.peekToken().value +
					"\"");
			} else if (this.peekCheck(TokenType.RBRACE)) {
				break;
			}
		}

		if (this.peekCheck(TokenType.RBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"}\", got \"" + this.peekToken().value + "\"");
		}

		return new IodeTry(body, catchArgs, catchBody);
	};

	this.parseJavaScript = function() {
		return new IodeEmbedded(this.nextToken().value);
	};

	this.parseNamespace = function() {
		this.skipNewline();
    this.nextTokenNewline();
		var name = "";

		if (this.peekCheck(TokenType.IDENTIFIER)) {
			name = this.nextToken().value;
			this.skipNewline();
		} else {
			this.error("Expected a name");
		}

		if (this.peekCheck(TokenType.LBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"{\"");
		}

		var body = [];

		while (!this.peekCheck(TokenType.RBRACE)) {
			var block = this.parseNextNamespace();
			this.skipNewline();

			if (block === null) {
				this.error("Namespaces may consist of functions, classes and global variables");
			}

			this.skipNewline();
			body.push(block);
		}

		if (this.peekCheck(TokenType.RBRACE)) {
      this.nextTokenNewline();
		} else {
			this.error("Expected a \"}\"");
		}

		return new IodeNamespace(name, body);
	};

	this.parseNextClass = function() {
		try {
			var tok = this.peekToken();

			switch (tok.type) {
				case TokenType.FUNCTION:
					return this.parseFunction();
				case TokenType.IDENTIFIER:
					return this.parseIdentifier();
				case TokenType.NEWLINE:
					return this.parseNewline();
				default:
					return null;
			}
		} catch (e) {
			this.error(e);
			return null;
		}
	};

	this.parseNextNamespace = function() {
		try {
			var tok = this.peekToken();

			switch (tok.type) {
				case TokenType.FUNCTION:
					return this.parseFunction();
				case TokenType.IDENTIFIER:
					return this.parseIdentifier();
				case TokenType.CLASS:
					return this.parseClass();
				case TokenType.NEWLINE:
					return this.parseNewline();
				default:
					return null;
			}
		} catch (e) {
			this.error(e);
			return null;
		}
	};

	this.parseNextLiteral = function() {
		try {
			var tok = this.peekToken();

			switch (tok.type) {
				case TokenType.LBRACE:
					return this.parseJSON();
				case TokenType.IDENTIFIER:
					return this.parseIdentifier();
				case TokenType.NUMBER:
					return this.parseNumber();
				case TokenType.LBRACK:
					return this.parseArray(false);
				case TokenType.BOOLEAN:
					return this.parseBoolean();
				case TokenType.STRING:
					return this.parseString();
				case TokenType.FUNCTION:
					return this.parseFunction();
				case TokenType.LPAREN:
					return this.parseParenthesis();
				case TokenType.EXCLAMATION:
					return this.parseNot();
				case TokenType.PATTERN:
					return this.parsePattern();
				case TokenType.NEW:
					return this.parseNew();
				case TokenType.EMBEDDED:
					return this.parseJavaScript();
				default:
					this.error("Could not parse expression \"" + tok.type.toLowerCase() + "\"");
					return null;
			}
		} catch (e) {
			throw e;
			this.error("Could not parse next expression. " + e);
			return null;
		}
	};

	this.parseNext = function() {
		try {
			var tok = this.peekToken();

			switch (tok.type) {
				case TokenType.NAMESPACE:
					return this.parseNamespace();
				case TokenType.IDENTIFIER:
					return this.parseIdentifier();
				case TokenType.CLASS:
					return this.parseClass();
				case TokenType.NUMBER:
					return this.parseNumber();
				case TokenType.LBRACK:
					return this.parseArray(false);
				case TokenType.BOOLEAN:
					return this.parseBoolean();
				case TokenType.STRING:
					return this.parseString();
				case TokenType.VAR:
					return this.parseVariableDeclaration();
				case TokenType.INCLUDE:
					return this.parseInclude();
				case TokenType.FUNCTION:
					return this.parseFunction();
				case TokenType.REPEAT:
					return this.parseRepeat();
				case TokenType.LPAREN:
					return this.parseParenthesis();
				case TokenType.NEWLINE:
					return this.parseNewline();
				case TokenType.WHILE:
					return this.parseWhile();
				case TokenType.UNTIL:
					return this.parseUntil();
				case TokenType.IF:
					return this.parseIf();
				case TokenType.EXCLAMATION:
					return this.parseNot();
				case TokenType.FOREACH:
					return this.parseForeach();
				case TokenType.CONST:
					return this.parseConst();
				case TokenType.PATTERN:
					return this.parsePattern();
				case TokenType.RETURN:
					return this.parseReturn();
				case TokenType.CONTINUE:
					return this.parseContinue();
				case TokenType.THROW:
					return this.parseThrow();
				case TokenType.NEW:
					return this.parseNew();
				case TokenType.FOR:
					return this.parseFor();
				case TokenType.TRY:
					return this.parseTry();
				case TokenType.LBRACE:
					return this.parseJSON();
				case TokenType.EMBEDDED:
					return this.parseJavaScript();
				default:
					this.error("Could not parse expression \"" + tok.type.toLowerCase() + "\"");
					return null;
			}
		} catch (e) {
			throw e;
			this.error("Could not parse next expression. " + e);
			return null;
		}
	};

	this.parse = function() {
		var exprs = [];

		while (this.pos < this.totalTokens) {
			exprs.push(this.parseNext());
		}

		return exprs;
	};

	this.treeTokens = function(exprs) {
		console.log(exprs);
	};
};

exports.Parser = Parser;
