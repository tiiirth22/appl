"""Simple expression -> TAC/Quadruples/Triples generator.

Supports nested parentheses, precedence, constant folding, and common subexpression elimination.
"""

import re

# AST nodes
class Node:
    pass

class Num(Node):
    def __init__(self, v):
        self.v = float(v)

    def __repr__(self):
        return f"{self.v}"

class Var(Node):
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return self.name

class Call(Node):
    def __init__(self, name, args):
        self.name = name
        self.args = args

    def __repr__(self):
        return f"{self.name}({', '.join(map(str, self.args))})"

class BinOp(Node):
    def __init__(self, op, left, right):
        self.op = op
        self.left = left
        self.right = right

    def __repr__(self):
        return f"({self.left} {self.op} {self.right})"


def tokenize(s):
    token_re = re.compile(r"\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(.))")
    for num, name, op in token_re.findall(s):
        if num:
            yield ("NUM", num)
        elif name:
            yield ("NAME", name)
        else:
            yield (op, op)
    yield ("$", "$")


class Parser:
    def __init__(self, text):
        self.tokens = iter(tokenize(text))
        self.cur = None
        self.next()

    def next(self):
        self.cur = next(self.tokens)

    def eat(self, kind):
        if self.cur[0] == kind:
            val = self.cur[1]
            self.next()
            return val
        raise SyntaxError(f"Expected {kind}, got {self.cur}")

    def parse(self):
        node = self.expr()
        if self.cur[0] != "$":
            raise SyntaxError("Unexpected token")
        return node

    def expr(self):
        node = self.term()
        while self.cur[0] in ("+", "-"):
            op = self.cur[0]
            self.next()
            node = BinOp(op, node, self.term())
        return node

    def term(self):
        node = self.factor()
        while self.cur[0] in ("*", "/"):
            op = self.cur[0]
            self.next()
            node = BinOp(op, node, self.factor())
        return node

    def factor(self):
        if self.cur[0] == "NUM":
            v = self.cur[1]
            self.next()
            return Num(v)
        if self.cur[0] == "NAME":
            name = self.cur[1]
            self.next()
            if self.cur[0] == "(":
                self.next()
                args = []
                if self.cur[0] != ")":
                    args.append(self.expr())
                    while self.cur[0] == ",":
                        self.next()
                        args.append(self.expr())
                self.eat(")")
                return Call(name, args)
            return Var(name)
        if self.cur[0] == "(":
            self.next()
            node = self.expr()
            self.eat(")")
            return node
        raise SyntaxError(f"Unexpected token {self.cur}")


def fold_constants(node):
    if isinstance(node, BinOp):
        left = fold_constants(node.left)
        right = fold_constants(node.right)
        if isinstance(left, Num) and isinstance(right, Num):
            a, b = left.v, right.v
            if node.op == "+":
                return Num(a + b)
            if node.op == "-":
                return Num(a - b)
            if node.op == "*":
                return Num(a * b)
            if node.op == "/":
                return Num(a / b)
        return BinOp(node.op, left, right)
    if isinstance(node, Call):
        return Call(node.name, [fold_constants(a) for a in node.args])
    return node


class IRBuilder:
    def __init__(self):
        self.t = 0
        self.tac = []
        self.quads = []
        self.triples = []
        self.subexpr = {}

    def new_temp(self):
        self.t += 1
        return f"t{self.t}"

    def key(self, node):
        if isinstance(node, Num):
            return ("num", node.v)
        if isinstance(node, Var):
            return ("var", node.name)
        if isinstance(node, Call):
            return ("call", node.name, tuple(self.key(a) for a in node.args))
        if isinstance(node, BinOp):
            return ("bin", node.op, self.key(node.left), self.key(node.right))
        raise ValueError(node)

    def build(self, node):
        node = fold_constants(node)
        k = self.key(node)
        if k in self.subexpr:
            return self.subexpr[k]
        if isinstance(node, Num):
            return str(node.v)
        if isinstance(node, Var):
            return node.name
        if isinstance(node, Call):
            args = [self.build(a) for a in node.args]
            res = self.new_temp()
            self.emit(f"{res} = call {node.name}({', '.join(args)})", "call", ", ".join(args), "", res)
            self.subexpr[k] = res
            return res
        if isinstance(node, BinOp):
            l = self.build(node.left)
            r = self.build(node.right)
            res = self.new_temp()
            self.emit(f"{res} = {l} {node.op} {r}", node.op, l, r, res)
            self.subexpr[k] = res
            return res
        raise ValueError(node)

    def emit(self, tac, op, arg1, arg2, res):
        self.tac.append(tac)
        self.quads.append((op, arg1, arg2, res))
        self.triples.append((op, arg1, arg2))


def generate_ir(expr):
    ast = Parser(expr).parse()
    builder = IRBuilder()
    res = builder.build(ast)
    return res, builder


def demo():
    expr = "((quiz1 + quiz2)/2 * 0.2) + ((assignment1 + assignment2 * 2)/3 * 0.4) + attendance(lectures, present)"

    print("Expression:", expr)
    res, ir = generate_ir(expr)

    print("\nTAC:")
    for line in ir.tac:
        print(" ", line)
    print("\nQuadruples:")
    for q in ir.quads:
        print(" ", q)
    print("\nTriples:")
    for i, t in enumerate(ir.triples):
        print(f"  {i}: {t}")
    print("\nFinal result temp:", res)


if __name__ == "__main__":
    demo()
