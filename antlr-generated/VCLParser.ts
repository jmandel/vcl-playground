
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
    public static readonly CODE_QUOTED = 21;
    public static readonly STRING = 22;
    public static readonly NUMBER = 23;
    public static readonly BOOLEAN = 24;
    public static readonly DATE = 25;
    public static readonly WS = 26;
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
    public static readonly RULE_filterTail = 11;
    public static readonly RULE_hierarchyOperator = 12;
    public static readonly RULE_scalarValue = 13;
    public static readonly RULE_codeValue = 14;
    public static readonly RULE_stringValue = 15;
    public static readonly RULE_numberValue = 16;
    public static readonly RULE_booleanValue = 17;
    public static readonly RULE_dateValue = 18;

    public static readonly literalNames = [
        null, "'-'", "'('", "')'", "';'", "','", "'.'", "'*'", "'~<<'", 
        "'!!<'", "'~^'", "'<<'", "'>>'", "'<!'", "'='", "'<'", "'/'", "'^'", 
        "'?'"
    ];

    public static readonly symbolicNames = [
        null, "DASH", "OPEN", "CLOSE", "SEMI", "COMMA", "DOT", "STAR", "IS_NOT_A", 
        "DESC_LEAF", "NOT_IN", "IS_A", "GENERALIZES", "CHILD_OF", "EQ", 
        "DESC_OF", "REGEX", "IN", "EXISTS", "URI", "SCODE", "CODE_QUOTED", 
        "STRING", "NUMBER", "BOOLEAN", "DATE", "WS"
    ];
    public static readonly ruleNames = [
        "vcl", "expr", "disjunction", "conjunction", "exclusion", "primary", 
        "scoped", "core", "navTail", "includeVs", "codeLed", "filterTail", 
        "hierarchyOperator", "scalarValue", "codeValue", "stringValue", 
        "numberValue", "booleanValue", "dateValue",
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
            this.state = 38;
            this.expr();
            this.state = 39;
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
            this.state = 41;
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
            this.state = 43;
            this.conjunction();
            this.state = 48;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 4) {
                {
                {
                this.state = 44;
                this.match(VCLParser.SEMI);
                this.state = 45;
                this.conjunction();
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
    public conjunction(): ConjunctionContext {
        let localContext = new ConjunctionContext(this.context, this.state);
        this.enterRule(localContext, 6, VCLParser.RULE_conjunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 51;
            this.exclusion();
            this.state = 56;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 5) {
                {
                {
                this.state = 52;
                this.match(VCLParser.COMMA);
                this.state = 53;
                this.exclusion();
                }
                }
                this.state = 58;
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
            this.state = 59;
            this.primary();
            this.state = 62;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 1) {
                {
                this.state = 60;
                this.match(VCLParser.DASH);
                this.state = 61;
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
            this.state = 65;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context) ) {
            case 1:
                {
                this.state = 64;
                this.scoped();
                }
                break;
            }
            this.state = 67;
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
            this.state = 69;
            this.match(VCLParser.OPEN);
            this.state = 70;
            this.match(VCLParser.URI);
            this.state = 71;
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
            this.state = 89;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 6, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 73;
                this.match(VCLParser.STAR);
                this.state = 75;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 6) {
                    {
                    this.state = 74;
                    this.navTail();
                    }
                }

                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 77;
                this.match(VCLParser.STAR);
                this.state = 78;
                this.hierarchyOperator();
                this.state = 79;
                this.codeValue();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 81;
                this.includeVs();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 82;
                this.codeLed();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 83;
                this.match(VCLParser.OPEN);
                this.state = 84;
                this.expr();
                this.state = 85;
                this.match(VCLParser.CLOSE);
                this.state = 87;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 6) {
                    {
                    this.state = 86;
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
            this.state = 93;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 91;
                this.match(VCLParser.DOT);
                this.state = 92;
                this.codeValue();
                }
                }
                this.state = 95;
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
            this.state = 97;
            this.match(VCLParser.IN);
            this.state = 102;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case VCLParser.URI:
                {
                this.state = 98;
                this.match(VCLParser.URI);
                }
                break;
            case VCLParser.OPEN:
                {
                this.state = 99;
                this.match(VCLParser.OPEN);
                this.state = 100;
                this.match(VCLParser.URI);
                this.state = 101;
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
            this.state = 104;
            this.codeValue();
            this.state = 109;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 6) {
                {
                {
                this.state = 105;
                this.match(VCLParser.DOT);
                this.state = 106;
                this.codeValue();
                }
                }
                this.state = 111;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 113;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 524032) !== 0)) {
                {
                this.state = 112;
                this.filterTail();
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
    public filterTail(): FilterTailContext {
        let localContext = new FilterTailContext(this.context, this.state);
        this.enterRule(localContext, 22, VCLParser.RULE_filterTail);
        let _la: number;
        try {
            this.state = 132;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case VCLParser.EQ:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 115;
                this.match(VCLParser.EQ);
                this.state = 116;
                this.scalarValue();
                }
                break;
            case VCLParser.IS_NOT_A:
            case VCLParser.DESC_LEAF:
            case VCLParser.IS_A:
            case VCLParser.GENERALIZES:
            case VCLParser.CHILD_OF:
            case VCLParser.DESC_OF:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 117;
                this.hierarchyOperator();
                this.state = 118;
                this.codeValue();
                }
                break;
            case VCLParser.REGEX:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 120;
                this.match(VCLParser.REGEX);
                this.state = 121;
                this.stringValue();
                }
                break;
            case VCLParser.NOT_IN:
            case VCLParser.IN:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 122;
                _la = this.tokenStream.LA(1);
                if(!(_la === 10 || _la === 17)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 128;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case VCLParser.URI:
                    {
                    this.state = 123;
                    this.match(VCLParser.URI);
                    }
                    break;
                case VCLParser.OPEN:
                    {
                    this.state = 124;
                    this.match(VCLParser.OPEN);
                    this.state = 125;
                    this.expr();
                    this.state = 126;
                    this.match(VCLParser.CLOSE);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                break;
            case VCLParser.EXISTS:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 130;
                this.match(VCLParser.EXISTS);
                this.state = 131;
                this.booleanValue();
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
    public hierarchyOperator(): HierarchyOperatorContext {
        let localContext = new HierarchyOperatorContext(this.context, this.state);
        this.enterRule(localContext, 24, VCLParser.RULE_hierarchyOperator);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 134;
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
    public scalarValue(): ScalarValueContext {
        let localContext = new ScalarValueContext(this.context, this.state);
        this.enterRule(localContext, 26, VCLParser.RULE_scalarValue);
        try {
            this.state = 141;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case VCLParser.SCODE:
            case VCLParser.CODE_QUOTED:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 136;
                this.codeValue();
                }
                break;
            case VCLParser.STRING:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 137;
                this.stringValue();
                }
                break;
            case VCLParser.NUMBER:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 138;
                this.numberValue();
                }
                break;
            case VCLParser.BOOLEAN:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 139;
                this.booleanValue();
                }
                break;
            case VCLParser.DATE:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 140;
                this.dateValue();
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
            this.state = 143;
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
    public stringValue(): StringValueContext {
        let localContext = new StringValueContext(this.context, this.state);
        this.enterRule(localContext, 30, VCLParser.RULE_stringValue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 145;
            this.match(VCLParser.STRING);
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
    public numberValue(): NumberValueContext {
        let localContext = new NumberValueContext(this.context, this.state);
        this.enterRule(localContext, 32, VCLParser.RULE_numberValue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 147;
            this.match(VCLParser.NUMBER);
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
    public booleanValue(): BooleanValueContext {
        let localContext = new BooleanValueContext(this.context, this.state);
        this.enterRule(localContext, 34, VCLParser.RULE_booleanValue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 149;
            this.match(VCLParser.BOOLEAN);
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
    public dateValue(): DateValueContext {
        let localContext = new DateValueContext(this.context, this.state);
        this.enterRule(localContext, 36, VCLParser.RULE_dateValue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 151;
            this.match(VCLParser.DATE);
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
        4,1,26,154,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,1,0,1,0,1,0,1,
        1,1,1,1,2,1,2,1,2,5,2,47,8,2,10,2,12,2,50,9,2,1,3,1,3,1,3,5,3,55,
        8,3,10,3,12,3,58,9,3,1,4,1,4,1,4,3,4,63,8,4,1,5,3,5,66,8,5,1,5,1,
        5,1,6,1,6,1,6,1,6,1,7,1,7,3,7,76,8,7,1,7,1,7,1,7,1,7,1,7,1,7,1,7,
        1,7,1,7,1,7,3,7,88,8,7,3,7,90,8,7,1,8,1,8,4,8,94,8,8,11,8,12,8,95,
        1,9,1,9,1,9,1,9,1,9,3,9,103,8,9,1,10,1,10,1,10,5,10,108,8,10,10,
        10,12,10,111,9,10,1,10,3,10,114,8,10,1,11,1,11,1,11,1,11,1,11,1,
        11,1,11,1,11,1,11,1,11,1,11,1,11,1,11,3,11,129,8,11,1,11,1,11,3,
        11,133,8,11,1,12,1,12,1,13,1,13,1,13,1,13,1,13,3,13,142,8,13,1,14,
        1,14,1,15,1,15,1,16,1,16,1,17,1,17,1,18,1,18,1,18,0,0,19,0,2,4,6,
        8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,0,3,2,0,10,10,17,17,
        3,0,8,9,11,13,15,15,1,0,20,21,157,0,38,1,0,0,0,2,41,1,0,0,0,4,43,
        1,0,0,0,6,51,1,0,0,0,8,59,1,0,0,0,10,65,1,0,0,0,12,69,1,0,0,0,14,
        89,1,0,0,0,16,93,1,0,0,0,18,97,1,0,0,0,20,104,1,0,0,0,22,132,1,0,
        0,0,24,134,1,0,0,0,26,141,1,0,0,0,28,143,1,0,0,0,30,145,1,0,0,0,
        32,147,1,0,0,0,34,149,1,0,0,0,36,151,1,0,0,0,38,39,3,2,1,0,39,40,
        5,0,0,1,40,1,1,0,0,0,41,42,3,4,2,0,42,3,1,0,0,0,43,48,3,6,3,0,44,
        45,5,4,0,0,45,47,3,6,3,0,46,44,1,0,0,0,47,50,1,0,0,0,48,46,1,0,0,
        0,48,49,1,0,0,0,49,5,1,0,0,0,50,48,1,0,0,0,51,56,3,8,4,0,52,53,5,
        5,0,0,53,55,3,8,4,0,54,52,1,0,0,0,55,58,1,0,0,0,56,54,1,0,0,0,56,
        57,1,0,0,0,57,7,1,0,0,0,58,56,1,0,0,0,59,62,3,10,5,0,60,61,5,1,0,
        0,61,63,3,10,5,0,62,60,1,0,0,0,62,63,1,0,0,0,63,9,1,0,0,0,64,66,
        3,12,6,0,65,64,1,0,0,0,65,66,1,0,0,0,66,67,1,0,0,0,67,68,3,14,7,
        0,68,11,1,0,0,0,69,70,5,2,0,0,70,71,5,19,0,0,71,72,5,3,0,0,72,13,
        1,0,0,0,73,75,5,7,0,0,74,76,3,16,8,0,75,74,1,0,0,0,75,76,1,0,0,0,
        76,90,1,0,0,0,77,78,5,7,0,0,78,79,3,24,12,0,79,80,3,28,14,0,80,90,
        1,0,0,0,81,90,3,18,9,0,82,90,3,20,10,0,83,84,5,2,0,0,84,85,3,2,1,
        0,85,87,5,3,0,0,86,88,3,16,8,0,87,86,1,0,0,0,87,88,1,0,0,0,88,90,
        1,0,0,0,89,73,1,0,0,0,89,77,1,0,0,0,89,81,1,0,0,0,89,82,1,0,0,0,
        89,83,1,0,0,0,90,15,1,0,0,0,91,92,5,6,0,0,92,94,3,28,14,0,93,91,
        1,0,0,0,94,95,1,0,0,0,95,93,1,0,0,0,95,96,1,0,0,0,96,17,1,0,0,0,
        97,102,5,17,0,0,98,103,5,19,0,0,99,100,5,2,0,0,100,101,5,19,0,0,
        101,103,5,3,0,0,102,98,1,0,0,0,102,99,1,0,0,0,103,19,1,0,0,0,104,
        109,3,28,14,0,105,106,5,6,0,0,106,108,3,28,14,0,107,105,1,0,0,0,
        108,111,1,0,0,0,109,107,1,0,0,0,109,110,1,0,0,0,110,113,1,0,0,0,
        111,109,1,0,0,0,112,114,3,22,11,0,113,112,1,0,0,0,113,114,1,0,0,
        0,114,21,1,0,0,0,115,116,5,14,0,0,116,133,3,26,13,0,117,118,3,24,
        12,0,118,119,3,28,14,0,119,133,1,0,0,0,120,121,5,16,0,0,121,133,
        3,30,15,0,122,128,7,0,0,0,123,129,5,19,0,0,124,125,5,2,0,0,125,126,
        3,2,1,0,126,127,5,3,0,0,127,129,1,0,0,0,128,123,1,0,0,0,128,124,
        1,0,0,0,129,133,1,0,0,0,130,131,5,18,0,0,131,133,3,34,17,0,132,115,
        1,0,0,0,132,117,1,0,0,0,132,120,1,0,0,0,132,122,1,0,0,0,132,130,
        1,0,0,0,133,23,1,0,0,0,134,135,7,1,0,0,135,25,1,0,0,0,136,142,3,
        28,14,0,137,142,3,30,15,0,138,142,3,32,16,0,139,142,3,34,17,0,140,
        142,3,36,18,0,141,136,1,0,0,0,141,137,1,0,0,0,141,138,1,0,0,0,141,
        139,1,0,0,0,141,140,1,0,0,0,142,27,1,0,0,0,143,144,7,2,0,0,144,29,
        1,0,0,0,145,146,5,22,0,0,146,31,1,0,0,0,147,148,5,23,0,0,148,33,
        1,0,0,0,149,150,5,24,0,0,150,35,1,0,0,0,151,152,5,25,0,0,152,37,
        1,0,0,0,14,48,56,62,65,75,87,89,95,102,109,113,128,132,141
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
    public codeValue(): CodeValueContext | null {
        return this.getRuleContext(0, CodeValueContext);
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
    public filterTail(): FilterTailContext | null {
        return this.getRuleContext(0, FilterTailContext);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_codeLed;
    }
}


export class FilterTailContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQ(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.EQ, 0);
    }
    public scalarValue(): ScalarValueContext | null {
        return this.getRuleContext(0, ScalarValueContext);
    }
    public hierarchyOperator(): HierarchyOperatorContext | null {
        return this.getRuleContext(0, HierarchyOperatorContext);
    }
    public codeValue(): CodeValueContext | null {
        return this.getRuleContext(0, CodeValueContext);
    }
    public REGEX(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.REGEX, 0);
    }
    public stringValue(): StringValueContext | null {
        return this.getRuleContext(0, StringValueContext);
    }
    public IN(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.IN, 0);
    }
    public NOT_IN(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.NOT_IN, 0);
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
    public EXISTS(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.EXISTS, 0);
    }
    public booleanValue(): BooleanValueContext | null {
        return this.getRuleContext(0, BooleanValueContext);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_filterTail;
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


export class ScalarValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public codeValue(): CodeValueContext | null {
        return this.getRuleContext(0, CodeValueContext);
    }
    public stringValue(): StringValueContext | null {
        return this.getRuleContext(0, StringValueContext);
    }
    public numberValue(): NumberValueContext | null {
        return this.getRuleContext(0, NumberValueContext);
    }
    public booleanValue(): BooleanValueContext | null {
        return this.getRuleContext(0, BooleanValueContext);
    }
    public dateValue(): DateValueContext | null {
        return this.getRuleContext(0, DateValueContext);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_scalarValue;
    }
}


export class CodeValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SCODE(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.SCODE, 0);
    }
    public CODE_QUOTED(): antlr.TerminalNode | null {
        return this.getToken(VCLParser.CODE_QUOTED, 0);
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_codeValue;
    }
}


export class StringValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(VCLParser.STRING, 0)!;
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_stringValue;
    }
}


export class NumberValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NUMBER(): antlr.TerminalNode {
        return this.getToken(VCLParser.NUMBER, 0)!;
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_numberValue;
    }
}


export class BooleanValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BOOLEAN(): antlr.TerminalNode {
        return this.getToken(VCLParser.BOOLEAN, 0)!;
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_booleanValue;
    }
}


export class DateValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DATE(): antlr.TerminalNode {
        return this.getToken(VCLParser.DATE, 0)!;
    }
    public override get ruleIndex(): number {
        return VCLParser.RULE_dateValue;
    }
}
