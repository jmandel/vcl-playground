grammar VCL;

vcl         : expr EOF ;
expr        : disjunction ;
disjunction : conjunction (SEMI conjunction)* ;
conjunction : exclusion (COMMA exclusion)* ;
exclusion   : primary (DASH primary)? ;

primary     : scoped? core ;
scoped      : OPEN URI CLOSE ;

core        : STAR navTail?
            | STAR hierarchyOperator filterValue
            | includeVs
            | codeLed
            | OPEN expr CLOSE navTail?
            ;

navTail     : (DOT codeValue)+ ;
includeVs   : IN (URI | OPEN URI CLOSE) ;
codeLed     : codeValue (DOT codeValue)* (operator filterValue)? ;

hierarchyOperator
            : IS_A
            | IS_NOT_A
            | DESC_OF
            | GENERALIZES
            | CHILD_OF
            | DESC_LEAF
            ;

operator    : EQ
            | IS_A
            | IS_NOT_A
            | DESC_OF
            | REGEX
            | IN
            | NOT_IN
            | GENERALIZES
            | CHILD_OF
            | DESC_LEAF
            | EXISTS
            ;

filterValue : codeValue
            | URI
            | OPEN expr CLOSE
            ;

codeValue   : SCODE | QUOTED ;

DASH        : '-' ;
OPEN        : '(' ;
CLOSE       : ')' ;
SEMI        : ';' ;
COMMA       : ',' ;
DOT         : '.' ;
STAR        : '*' ;

IS_NOT_A    : '~<<' ;
DESC_LEAF   : '!!<' ;
NOT_IN      : '~^' ;
IS_A        : '<<' ;
GENERALIZES : '>>' ;
CHILD_OF    : '<!' ;

EQ          : '=' ;
DESC_OF     : '<' ;
REGEX       : '/' ;
IN          : '^' ;
EXISTS      : '?' ;

URI         : [a-zA-Z]+ ':' URI_BODY ;
fragment URI_BODY : URI_CHAR* [./] URI_CHAR* ;
fragment URI_CHAR : [a-zA-Z0-9?=:;&_%+\-.@#$^!{}/] ;

SCODE       : [a-zA-Z0-9] [-_a-zA-Z0-9]* ;
QUOTED      : '"' (~["\\] | '\\' .)* '"' ;

WS          : [ \t\r\n]+ -> skip ;
