
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class VCLParser extends antlr.Parser {
    public static readonly DASH = 1;
    public static readonly OPEN = 2;
    public static readonly CLOSE = 3;
    public static readonly SEMI = 4;
    public static readonly COMMA = 5;
    public static readonly DOT = 6;
    public static readonly STAR = 7;
    public static readonly IS_NOT_A = 8;
    public static readonly DESC_LEAF = 9;
    public static readonly NOT_IN = 10;
    public static readonly IS_A = 11;
    public static readonly GENERALIZES = 12;
    public static readonly CHILD_OF = 13;
    public static readonly EQ = 14;
    public static readonly DESC_OF = 15;
    public static readonly REGEX = 16;
    public static readonly IN = 17;
    public static readonly EXISTS = 18;
    public static readonly URI = 19;
    public static readonly SCODE = 20;
    public static readonly QUOTED = 21;
    public static readonly WS = 22;
    public static readonly RULE_vcl = 0;
    public static readonly RULE_expr = 1;
    public static readonly RULE_disjunction = 2;
    public static readonly RULE_conjunction = 3;
    public static readonly RULE_exclusion = 4;
    public static readonly RULE_primary = 5;
    public static readonly RULE_scoped = 6;
    public static readonly RULE_core = 7;
    public static readonly RULE_navTail = 8;
    public static readonly RULE_includeVs = 9;
    public static readonly RULE_codeLed = 10;
    public static readonly RULE_hierarchyOperator = 11;
    public static readonly RULE_operator = 12;
    public static readonly RULE_filterValue = 13;
    public static readonly RULE_codeValue = 14;

    public static readonly literalNames = [
        null, "'-'", "'('", "')'", "';'", "','", "'.'", "'*'", "'~<<'", 
        "'!!<'", "'~^'", "'<<'", "'>>'", "'<!'", "'='", "'<'", "'/'", "'^'", 
        "'?'"
    ];

    public static readonly symbolicNames = [
        null, "DASH", "OPEN", "CLOSE", "SEMI", "COMMA", "DOT", "STAR", "IS_NOT_A", 
        "DESC_LEAF", "NOT_IN", "IS_A", "GENERALIZES", "CHILD_OF", "EQ", 
        "DESC_OF", "REGEX", "IN", "EXISTS", "URI", "SCODE", "QUOTED", "WS"
    ];
    public static readonly ruleNames = [
        "vcl", "expr", "disjunction", "conjunction", "exclusion", "primary", 
        "scoped", "core", "navTail", "includeVs", "codeLed", "hierarchyOperator", 
        "operator", "filterValue", "codeValue",
    ];

    public get grammarFileName(): string { return "VCL.g4"; }
    public get literalNames(): (string | null)[] { return VCLParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return VCLParser.symbolicNames; }
    public get ruleNames(): string[] { return VCLParser.ruleNames; }
    public get serializedATN(): number[] { return VCLParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, VCLParser._ATN, VCLParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public vcl(): VclContext {
        let localContext = new VclContext(this.context, this.state);
        this.enterRule(localContext, 0, VCLParser.RULE_vcl);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 30;
            this.expr();
            this.state = 31;
            this.match(VCLParser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public expr(): ExprContext {
        let localContext = new ExprContext(this.context, this.state);
        this.enterRule(localContext, 2, VCLParser.RULE_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 33;
            this.disjunction();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public disjunction(): DisjunctionContext {
        let localContext = new DisjunctionContext(this.context, this.state);
        this.enterRule(localContext, 4, VCLParser.RULE_disjunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 35;
            this.conjunction();
            this.state = 40;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 4) {
                {
                {
                this.state = 36;
                this.match(VCLParser.SEMI);
                this.state = 37;
                this.conjunction();
                }
                }
                this.state = 42;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public conjunction(): ConjunctionContext {
        let localContext = new ConjunctionContext(this.context, this.state);
        this.enterRule(localContext, 6, VCLParser.RULE_conjunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 43;
            this.exclusion();
            this.state = 48;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 5) {
                {
                {
                this.state = 44;
                this.match(VCLParser.COMMA);
                this.state = 45;
                this.exclusion();
                }
                }
                this.state = 50;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public exclusion(): ExclusionContext {
        let localContext = new ExclusionContext(this.context, this.state);
        this.enterRule(localContext, 8, VCLParser.RULE_exclusion);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 51;
            this.primary();
            this.state = 54;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 1) {
                {
                this.state = 52;
                this.match(VCLParser.DASH);
                this.state = 53;
                this.primary();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public primary(): PrimaryContext {
        let localContext = new PrimaryContext(this.context, this.state);
        this.enterRule(localContext, 10, VCLParser.RULE_primary);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 57;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context) ) {
            case 1:
                {
                this.state = 56;
                this.scoped();
                }
                break;
            }
            this.state = 59;
            this.core();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public scoped(): ScopedContext {
        let localContext = new ScopedContext(this.context, this.state);
        this.enterRule(localContext, 12, VCLParser.RULE_scoped);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 61;
            this.match(VCLParser.OPEN);
            this.state = 62;
            this.match(VCLParser.URI);
            this.state = 63;
            this.match(VCLParser.CLOSE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public core(): CoreContext {
        let localContext = new CoreContext(this.context, this.state);
        this.enterRule(localContext, 14, VCLParser.RULE_core);
        let _la: number;
        try {
            this.state = 81;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 6, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 65;
                this.match(VCLParser.STAR);
                this.state = 67;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 6) {
                    {
                    this.state = 66;
                    this.navTail();
                    }
                }

                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 69;
                this.match(VCLParser.STAR);
                this.state = 70;
                this.hierarchyOperator();
                this.state = 71;
                this.filterValue();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 73;
                this.includeVs();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 74;
                this.codeLed();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 75;
                this.match(VCLParser.OPEN);
                this.state = 76;
                this.expr();
                this.state = 77;
                this.match(VCLParser.CLOSE);
                this.state = 79;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 6) {
                    {
                    this.state = 78;
                    this.navTail();
                    }
                }

                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public navTail(): NavTailContext {
        let localContext = new NavTailContext(this.context, this.state);
        this.enterRule(localContext, 16, VCLParser.RULE_navTail);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 85;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 83;
                this.match(VCLParser.DOT);
                this.state = 84;
                this.codeValue();
                }
                }
                this.state = 87;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while (_la === 6);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public includeVs(): IncludeVsContext {
        let localContext = new IncludeVsContext(this.context, this.state);
        this.enterRule(localContext, 18, VCLParser.RULE_includeVs);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 89;
            this.match(VCLParser.IN);
            this.state = 94;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case VCLParser.URI:
                {
                this.state = 90;
                this.match(VCLParser.URI);
                }
                break;
            case VCLParser.OPEN:
                {
                this.state = 91;
                this.match(VCLParser.OPEN);
                this.state = 92;
                this.match(VCLParser.URI);
                this.state = 93;
                this.match(VCLParser.CLOSE);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public codeLed(): CodeLedContext {
        let localContext = new CodeLedContext(this.context, this.state);
        this.enterRule(localContext, 20, VCLParser.RULE_codeLed);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 96;
            this.codeValue();
            this.state = 101;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 6) {
                {
                {
                this.state = 97;
                this.match(VCLParser.DOT);
                this.state = 98;
                this.codeValue();
                }
                }
                this.state = 103;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 107;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 524032) !== 0)) {
                {
                this.state = 104;
                this.operator();
                this.state = 105;
                this.filterValue();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public hierarchyOperator(): HierarchyOperatorContext {
        let localContext = new HierarchyOperatorContext(this.context, this.state);
        this.enterRule(localContext, 22, VCLParser.RULE_hierarchyOperator);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 109;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 47872) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public operator(): OperatorContext {
        let localContext = new OperatorContext(this.context, this.state);
        this.enterRule(localContext, 24, VCLParser.RULE_operator);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 111;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 524032) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public filterValue(): FilterValueContext {
        let localContext = new FilterValueContext(this.context, this.state);
        this.enterRule(localContext, 26, VCLParser.RULE_filterValue);
        try {
            this.state = 119;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case VCLParser.SCODE:
            case VCLParser.QUOTED:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 113;
                this.codeValue();
                }
                break;
            case VCLParser.URI:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 114;
                this.match(VCLParser.URI);
                }
                break;
            case VCLParser.OPEN:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 115;
                this.match(VCLParser.OPEN);
                this.state = 116;
                this.expr();
                this.state = 117;
                this.match(VCLParser.CLOSE);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public codeValue(): CodeValueContext {
        let localContext = new CodeValueContext(this.context, this.state);
        this.enterRule(localContext, 28, VCLParser.RULE_codeValue);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 121;
            _la = this.tokenStream.LA(1);
            if(!(_la === 20 || _la === 21)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }

    public static readonly _serializedATN: number[] = [
        4,1,22,124,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,1,0,1,0,1,0,1,1,1,1,1,2,1,2,1,2,5,2,39,8,2,10,2,12,2,42,
        9,2,1,3,1,3,1,3,5,3,47,8,3,10,3,12,3,50,9,3,1,4,1,4,1,4,3,4,55,8,
        4,1,5,3,5,58,8,5,1,5,1,5,1,6,1,6,1,6,1,6,1,7,1,7,3,7,68,8,7,1,7,
        1,7,1,7,1,7,1,7,1,7,1,7,1,7,1,7,1,7,3,7,80,8,7,3,7,82,8,7,1,8,1,
        8,4,8,86,8,8,11,8,12,8,87,1,9,1,9,1,9,1,9,1,9,3,9,95,8,9,1,10,1,
        10,1,10,5,10,100,8,10,10,10,12,10,103,9,10,1,10,1,10,1,10,3,10,108,
        8,10,1,11,1,11,1,12,1,12,1,13,1,13,1,13,1,13,1,13,1,13,3,13,120,
        8,13,1,14,1,14,1,14,0,0,15,0,2,4,6,8,10,12,14,16,18,20,22,24,26,
        28,0,3,3,0,8,9,11,13,15,15,1,0,8,18,1,0,20,21,124,0,30,1,0,0,0,2,
        33,1,0,0,0,4,35,1,0,0,0,6,43,1,0,0,0,8,51,1,0,0,0,10,57,1,0,0,0,
        12,61,1,0,0,0,14,81,1,0,0,0,16,85,1,0,0,0,18,89,1,0,0,0,20,96,1,
        0,0,0,22,109,1,0,0,0,24,111,1,0,0,0,26,119,1,0,0,0,28,121,1,0,0,
        0,30,31,3,2,1,0,31,32,5,0,0,1,32,1,1,0,0,0,33,34,3,4,2,0,34,3,1,
        0,0,0,35,40,3,6,3,0,36,37,5,4,0,0,37,39,3,6,3,0,38,36,1,0,0,0,39,
        42,1,0,0,0,40,38,1,0,0,0,40,41,1,0,0,0,41,5,1,0,0,0,42,40,1,0,0,
        0,43,48,3,8,4,0,44,45,5,5,0,0,45,47,3,8,4,0,46,44,1,0,0,0,47,50,
        1,0,0,0,48,46,1,0,0,0,48,49,1,0,0,0,49,7,1,0,0,0,50,48,1,0,0,0,51,
        54,3,10,5,0,52,53,5,1,0,0,53,55,3,10,5,0,54,52,1,0,0,0,54,55,1,0,
        0,0,55,9,1,0,0,0,56,58,3,12,6,0,57,56,1,0,0,0,57,58,1,0,0,0,58,59,
        1,0,0,0,59,60,3,14,7,0,60,11,1,0,0,0,61,62,5,2,0,0,62,63,5,19,0,
        0,63,64,5,3,0,0,64,13,1,0,0,0,65,67,5,7,0,0,66,68,3,16,8,0,67,66,
        1,0,0,0,67,68,1,0,0,0,68,82,1,0,0,0,69,70,5,7,0,0,70,71,3,22,11,
        0,71,72,3,26,13,0,72,82,1,0,0,0,73,82,3,18,9,0,74,82,3,20,10,0,75,
        76,5,2,0,0,76,77,3,2,1,0,77,79,5,3,0,0,78,80,3,16,8,0,79,78,1,0,
        0,0,79,80,1,0,0,0,80,82,1,0,0,0,81,65,1,0,0,0,81,69,1,0,0,0,81,73,
        1,0,0,0,81,74,1,0,0,0,81,75,1,0,0,0,82,15,1,0,0,0,83,84,5,6,0,0,
        84,86,3,28,14,0,85,83,1,0,0,0,86,87,1,0,0,0,87,85,1,0,0,0,87,88,
        1,0,0,0,88,17,1,0,0,0,89,94,5,17,0,0,90,95,5,19,0,0,91,92,5,2,0,
        0,92,93,5,19,0,0,93,95,5,3,0,0,94,90,1,0,0,0,94,91,1,0,0,0,95,19,
        1,0,0,0,96,101,3,28,14,0,97,98,5,6,0,0,98,100,3,28,14,0,99,97,1,
        0,0,0,100,103,1,0,0,0,101,99,1,0,0,0,101,102,1,0,0,0,102,107,1,0,
        0,0,103,101,1,0,0,0,104,105,3,24,12,0,105,106,3,26,13,0,106,108,
        1,0,0,0,107,104,1,0,0,0,107,108,1,0,0,0,108,21,1,0,0,0,109,110,7,
        0,0,0,110,23,1,0,0,0,111,112,7,1,0,0,112,25,1,0,0,0,113,120,3,28,
        14,0,114,120,5,19,0,0,115,116,5,2,0,0,116,117,3,2,1,0,117,118,5,
        3,0,0,118,120,1,0,0,0,119,113,1,0,0,0,119,114,1,0,0,0,119,115,1,
        0,0,0,120,27,1,0,0,0,121,122,7,2,0,0,122,29,1,0,0,0,12,40,48,54,
        57,67,79,81,87,94,101,107,119
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!VCLParser.__ATN) {
            VCLParser.__ATN = new antlr.ATNDeserializer().deserialize(VCLParser._serializedATN);
        }

        return VCLParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(VCLParser.literalNames, VCLParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return VCLParser.vocabulary;
    }

    private static readonly decisionsToDFA = VCLParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class VclContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!;
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(VCLParser.EOF, 0)!;
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_vcl;
    }
}


export class ExprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public disjunction(): DisjunctionContext {
        return this.getRuleContext(0, DisjunctionContext)!;
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_expr;
    }
}


export class DisjunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public conjunction(): ConjunctionContext[];
    public conjunction(i: number): ConjunctionContext | null;
    public conjunction(i?: number): ConjunctionContext[] | ConjunctionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ConjunctionContext);
        }

        return this.getRuleContext(i, ConjunctionContext);
    }
    public SEMI(): antlr.TerminalNode[];
    public SEMI(i: number): antlr.TerminalNode | null;
    public SEMI(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(VCLParser.SEMI);
    	} else {
    		return this.getToken(VCLParser.SEMI, i);
    	}
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_disjunction;
    }
}


export class ConjunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public exclusion(): ExclusionContext[];
    public exclusion(i: number): ExclusionContext | null;
    public exclusion(i?: number): ExclusionContext[] | ExclusionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExclusionContext);
        }

        return this.getRuleContext(i, ExclusionContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(VCLParser.COMMA);
    	} else {
    		return this.getToken(VCLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_conjunction;
    }
}


export class ExclusionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public primary(): PrimaryContext[];
    public primary(i: number): PrimaryContext | null;
    public primary(i?: number): PrimaryContext[] | PrimaryContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PrimaryContext);
        }

        return this.getRuleContext(i, PrimaryContext);
    }
    public DASH(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.DASH, 0);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_exclusion;
    }
}


export class PrimaryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public core(): CoreContext {
        return this.getRuleContext(0, CoreContext)!;
    }
    public scoped(): ScopedContext | null {
        return this.getRuleContext(0, ScopedContext);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_primary;
    }
}


export class ScopedContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public OPEN(): antlr.TerminalNode {
        return this.getToken(VCLParser.OPEN, 0)!;
    }
    public URI(): antlr.TerminalNode {
        return this.getToken(VCLParser.URI, 0)!;
    }
    public CLOSE(): antlr.TerminalNode {
        return this.getToken(VCLParser.CLOSE, 0)!;
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_scoped;
    }
}


export class CoreContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public STAR(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.STAR, 0);
    }
    public navTail(): NavTailContext | null {
        return this.getRuleContext(0, NavTailContext);
    }
    public hierarchyOperator(): HierarchyOperatorContext | null {
        return this.getRuleContext(0, HierarchyOperatorContext);
    }
    public filterValue(): FilterValueContext | null {
        return this.getRuleContext(0, FilterValueContext);
    }
    public includeVs(): IncludeVsContext | null {
        return this.getRuleContext(0, IncludeVsContext);
    }
    public codeLed(): CodeLedContext | null {
        return this.getRuleContext(0, CodeLedContext);
    }
    public OPEN(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.OPEN, 0);
    }
    public expr(): ExprContext | null {
        return this.getRuleContext(0, ExprContext);
    }
    public CLOSE(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.CLOSE, 0);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_core;
    }
}


export class NavTailContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DOT(): antlr.TerminalNode[];
    public DOT(i: number): antlr.TerminalNode | null;
    public DOT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(VCLParser.DOT);
    	} else {
    		return this.getToken(VCLParser.DOT, i);
    	}
    }
    public codeValue(): CodeValueContext[];
    public codeValue(i: number): CodeValueContext | null;
    public codeValue(i?: number): CodeValueContext[] | CodeValueContext | null {
        if (i === undefined) {
            return this.getRuleContexts(CodeValueContext);
        }

        return this.getRuleContext(i, CodeValueContext);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_navTail;
    }
}


export class IncludeVsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IN(): antlr.TerminalNode {
        return this.getToken(VCLParser.IN, 0)!;
    }
    public URI(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.URI, 0);
    }
    public OPEN(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.OPEN, 0);
    }
    public CLOSE(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.CLOSE, 0);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_includeVs;
    }
}


export class CodeLedContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public codeValue(): CodeValueContext[];
    public codeValue(i: number): CodeValueContext | null;
    public codeValue(i?: number): CodeValueContext[] | CodeValueContext | null {
        if (i === undefined) {
            return this.getRuleContexts(CodeValueContext);
        }

        return this.getRuleContext(i, CodeValueContext);
    }
    public DOT(): antlr.TerminalNode[];
    public DOT(i: number): antlr.TerminalNode | null;
    public DOT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(VCLParser.DOT);
    	} else {
    		return this.getToken(VCLParser.DOT, i);
    	}
    }
    public operator(): OperatorContext | null {
        return this.getRuleContext(0, OperatorContext);
    }
    public filterValue(): FilterValueContext | null {
        return this.getRuleContext(0, FilterValueContext);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_codeLed;
    }
}


export class HierarchyOperatorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IS_A(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.IS_A, 0);
    }
    public IS_NOT_A(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.IS_NOT_A, 0);
    }
    public DESC_OF(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.DESC_OF, 0);
    }
    public GENERALIZES(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.GENERALIZES, 0);
    }
    public CHILD_OF(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.CHILD_OF, 0);
    }
    public DESC_LEAF(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.DESC_LEAF, 0);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_hierarchyOperator;
    }
}


export class OperatorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQ(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.EQ, 0);
    }
    public IS_A(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.IS_A, 0);
    }
    public IS_NOT_A(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.IS_NOT_A, 0);
    }
    public DESC_OF(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.DESC_OF, 0);
    }
    public REGEX(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.REGEX, 0);
    }
    public IN(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.IN, 0);
    }
    public NOT_IN(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.NOT_IN, 0);
    }
    public GENERALIZES(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.GENERALIZES, 0);
    }
    public CHILD_OF(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.CHILD_OF, 0);
    }
    public DESC_LEAF(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.DESC_LEAF, 0);
    }
    public EXISTS(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.EXISTS, 0);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_operator;
    }
}


export class FilterValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public codeValue(): CodeValueContext | null {
        return this.getRuleContext(0, CodeValueContext);
    }
    public URI(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.URI, 0);
    }
    public OPEN(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.OPEN, 0);
    }
    public expr(): ExprContext | null {
        return this.getRuleContext(0, ExprContext);
    }
    public CLOSE(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.CLOSE, 0);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_filterValue;
    }
}


export class CodeValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SCODE(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.SCODE, 0);
    }
    public QUOTED(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.QUOTED, 0);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_codeValue;
    }
}
