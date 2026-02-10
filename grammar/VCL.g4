grammar VCL;

vcl         : expr EOF ;
expr        : disjunction ;
disjunction : conjunction (SEMI conjunction)* ;
conjunction : exclusion (COMMA exclusion)* ;
exclusion   : primary (DASH primary)? ;

primary     : scoped? core ;
scoped      : OPEN URI CLOSE ;

core        : STAR navTail?
            | STAR hierarchyOperator codeValue
            | includeVs
            | codeLed
            | OPEN expr CLOSE navTail?
            ;

navTail     : (DOT codeValue)+ ;
includeVs   : IN (URI | OPEN URI CLOSE) ;
codeLed     : codeValue (DOT codeValue)* filterTail? ;

filterTail  : EQ scalarValue
            | hierarchyOperator codeValue
            | REGEX stringValue
            | (IN | NOT_IN) (URI | OPEN expr CLOSE)
            | EXISTS booleanValue
            ;

hierarchyOperator
            : IS_A
            | IS_NOT_A
            | DESC_OF
            | GENERALIZES
            | CHILD_OF
            | DESC_LEAF
            ;

scalarValue : codeValue
            | stringValue
            | numberValue
            | booleanValue
            | dateValue
            ;

codeValue   : SCODE | CODE_QUOTED ;
stringValue : STRING ;
numberValue : NUMBER ;
booleanValue: BOOLEAN ;
dateValue   : DATE ;

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
CODE_QUOTED : '\'' (~['\\] | '\\' .)* '\'' ;
STRING      : '"' (~["\\] | '\\' .)* '"' ;
NUMBER      : 'num:' '-'? [0-9]+ ('.' [0-9]+)? ;
BOOLEAN     : 'bool:true' | 'bool:false' ;
DATE        : 'date:' [0-9][0-9][0-9][0-9] '-' [0-9][0-9] '-' [0-9][0-9] ;

WS          : [ \t\r\n]+ -> skip ;
