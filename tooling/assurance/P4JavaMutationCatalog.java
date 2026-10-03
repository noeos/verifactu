import com.sun.source.tree.BinaryTree;
import com.sun.source.tree.CompilationUnitTree;
import com.sun.source.tree.LiteralTree;
import com.sun.source.tree.ReturnTree;
import com.sun.source.tree.Tree;
import com.sun.source.util.JavacTask;
import com.sun.source.util.SourcePositions;
import com.sun.source.util.TreePathScanner;
import com.sun.source.util.Trees;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.ToolProvider;

public final class P4JavaMutationCatalog {
  private record Mutation(String operator, long start, long end, String before, String after) {}

  private static int operatorOffset(String source, int from, int to, String token) {
    for (int index = from; index <= to - token.length();) {
      if (source.startsWith("//", index)) {
        int newline = source.indexOf('\n', index + 2);
        index = newline < 0 || newline >= to ? to : newline + 1;
      } else if (source.startsWith("/*", index)) {
        int end = source.indexOf("*/", index + 2);
        index = end < 0 || end >= to ? to : end + 2;
      } else if (source.startsWith(token, index)) {
        return index;
      } else {
        index++;
      }
    }
    return -1;
  }

  public static void main(String[] args) throws Exception {
    if (args.length != 1) throw new IllegalArgumentException("source path required");
    Path sourcePath = Path.of(args[0]);
    String source = Files.readString(sourcePath, StandardCharsets.UTF_8);
    JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    if (compiler == null) throw new IllegalStateException("JDK compiler unavailable");
    DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
    JavaFileObject input = new SimpleJavaFileObject(
        URI.create("string:///DssBridge.java"), JavaFileObject.Kind.SOURCE) {
      @Override public CharSequence getCharContent(boolean ignoreEncodingErrors) { return source; }
    };
    JavacTask task = (JavacTask) compiler.getTask(null, null, diagnostics, List.of("-proc:none"), null, List.of(input));
    CompilationUnitTree unit = task.parse().iterator().next();
    SourcePositions positions = Trees.instance(task).getSourcePositions();
    List<Mutation> mutations = new ArrayList<>();
    new TreePathScanner<Void, Void>() {
      @Override public Void visitBinary(BinaryTree node, Void unused) {
        Tree.Kind kind = node.getKind();
        String operator = switch (kind) {
          case LESS_THAN, LESS_THAN_EQUAL, GREATER_THAN, GREATER_THAN_EQUAL -> "conditional-boundary";
          case CONDITIONAL_AND, CONDITIONAL_OR -> "boolean-substitution";
          case PLUS, MINUS, MULTIPLY, DIVIDE, REMAINDER -> "arithmetic-operator";
          case EQUAL_TO, NOT_EQUAL_TO -> "equality-negation";
          default -> null;
        };
        if (operator != null) {
          String token = switch (kind) {
            case LESS_THAN -> "<"; case LESS_THAN_EQUAL -> "<=";
            case GREATER_THAN -> ">"; case GREATER_THAN_EQUAL -> ">=";
            case CONDITIONAL_AND -> "&&"; case CONDITIONAL_OR -> "||";
            case PLUS -> "+"; case MINUS -> "-"; case MULTIPLY -> "*";
            case DIVIDE -> "/"; case REMAINDER -> "%";
            case EQUAL_TO -> "=="; case NOT_EQUAL_TO -> "!=";
            default -> throw new IllegalStateException();
          };
          long leftEnd = positions.getEndPosition(unit, node.getLeftOperand());
          long rightStart = positions.getStartPosition(unit, node.getRightOperand());
          int start = operatorOffset(source, Math.toIntExact(leftEnd), Math.toIntExact(rightStart), token);
          if (start < leftEnd || start < 0) throw new IllegalStateException("operator span not found");
          String replacement = switch (token) {
            case "<" -> "<="; case "<=" -> "<";
            case ">" -> ">="; case ">=" -> ">";
            case "&&" -> "||"; case "||" -> "&&";
            case "+" -> "-"; case "-" -> "+";
            case "*" -> "/"; case "/" -> "*"; case "%" -> "*";
            case "==" -> "!="; case "!=" -> "==";
            default -> throw new IllegalStateException();
          };
          mutations.add(new Mutation(operator, start, start + token.length(), token, replacement));
        }
        return super.visitBinary(node, unused);
      }

      @Override public Void visitLiteral(LiteralTree node, Void unused) {
        if (node.getValue() instanceof Boolean value) {
          long start = positions.getStartPosition(unit, node);
          long end = positions.getEndPosition(unit, node);
          mutations.add(new Mutation("boolean-substitution", start, end, value ? "true" : "false", value ? "false" : "true"));
        }
        return super.visitLiteral(node, unused);
      }

      @Override public Void visitReturn(ReturnTree node, Void unused) {
        if (node.getExpression() instanceof LiteralTree literal && literal.getValue() instanceof Boolean value) {
          long start = positions.getStartPosition(unit, literal);
          long end = positions.getEndPosition(unit, literal);
          mutations.add(new Mutation("return-value", start, end, value ? "true" : "false", value ? "false" : "true"));
        }
        return super.visitReturn(node, unused);
      }
    }.scan(unit, null);
    mutations.sort((left, right) -> Long.compare(left.start(), right.start()));
    StringBuilder output = new StringBuilder("[");
    for (int index = 0; index < mutations.size(); index++) {
      Mutation value = mutations.get(index);
      if (index > 0) output.append(',');
      output.append("{\"operator\":\"").append(value.operator())
          .append("\",\"start\":").append(value.start())
          .append(",\"end\":").append(value.end())
          .append(",\"before\":\"").append(value.before())
          .append("\",\"after\":\"").append(value.after()).append("\"}");
    }
    System.out.println(output.append(']'));
  }
}
