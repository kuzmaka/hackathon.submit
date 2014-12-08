$(document).ready(function(){
    addBlockMove();
    addBlockTake();
    addBlockTrash();
    addBlockPut();
    addBlockRecycle();
    addBlockCountThings();

    Blockly.Blocks['controls_repeat'] = {
        /**
         * Block for repeat n times (internal number).
         * @this Blockly.Block
         */
        init: function() {
            this.setHelpUrl(Blockly.Msg.CONTROLS_REPEAT_HELPURL);
            this.setColour(280);
            this.appendDummyInput()
                .appendField(Blockly.Msg.CONTROLS_REPEAT_TITLE_REPEAT)
                .appendField(new Blockly.FieldTextInput('10',
                    Blockly.FieldTextInput.nonnegativeIntegerValidator), 'TIMES')
                .appendField(Blockly.Msg.CONTROLS_REPEAT_TITLE_TIMES);
            this.appendStatementInput('DO')
                .appendField(Blockly.Msg.CONTROLS_REPEAT_INPUT_DO);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setTooltip(Blockly.Msg.CONTROLS_REPEAT_TOOLTIP);
        }
    };

    Blockly.Blocks['controls_if'] = {
        /**
         * Block for if/elseif/else condition.
         * @this Blockly.Block
         */
        init: function () {
            this.setHelpUrl(Blockly.Msg.CONTROLS_IF_HELPURL);
            this.setColour(210);
            this.appendValueInput('IF0')
                .setAlign(Blockly.ALIGN_RIGHT)
                .setCheck('Boolean')
                .appendField(Blockly.Msg.CONTROLS_IF_MSG_IF);
            this.appendStatementInput('DO0')
                .appendField(Blockly.Msg.CONTROLS_IF_MSG_THEN);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            //this.setMutator(new Blockly.Mutator(['controls_if_elseif',
            //    'controls_if_else']));
            // Assign 'this' to a variable for use in the tooltip closure below.
            var thisBlock = this;
            this.setTooltip(function () {
                if (!thisBlock.elseifCount_ && !thisBlock.elseCount_) {
                    return Blockly.Msg.CONTROLS_IF_TOOLTIP_1;
                } else if (!thisBlock.elseifCount_ && thisBlock.elseCount_) {
                    return Blockly.Msg.CONTROLS_IF_TOOLTIP_2;
                } else if (thisBlock.elseifCount_ && !thisBlock.elseCount_) {
                    return Blockly.Msg.CONTROLS_IF_TOOLTIP_3;
                } else if (thisBlock.elseifCount_ && thisBlock.elseCount_) {
                    return Blockly.Msg.CONTROLS_IF_TOOLTIP_4;
                }
                return '';
            });
            this.elseifCount_ = 0;
            this.elseCount_ = 0;
        }
    };

    Blockly.Blocks['controls_whileUntil'] = {
        /**
         * Block for 'do while/until' loop.
         * @this Blockly.Block
         */
        init: function() {
            var OPERATORS =
                [[Blockly.Msg.CONTROLS_WHILEUNTIL_OPERATOR_WHILE, 'WHILE'],
                    [Blockly.Msg.CONTROLS_WHILEUNTIL_OPERATOR_UNTIL, 'UNTIL']];
            this.setHelpUrl(Blockly.Msg.CONTROLS_WHILEUNTIL_HELPURL);
            this.setColour(280);
            this.appendValueInput('BOOL')
                .setCheck('Boolean')
                .appendField(new Blockly.FieldDropdown(OPERATORS), 'MODE');
            this.appendStatementInput('DO')
                .appendField(Blockly.Msg.CONTROLS_WHILEUNTIL_INPUT_DO);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            // Assign 'this' to a variable for use in the tooltip closure below.
            var thisBlock = this;
            this.setTooltip(function() {
                var op = thisBlock.getFieldValue('MODE');
                var TOOLTIPS = {
                    'WHILE': Blockly.Msg.CONTROLS_WHILEUNTIL_TOOLTIP_WHILE,
                    'UNTIL': Blockly.Msg.CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL
                };
                return TOOLTIPS[op];
            });
        }
    };

    var toolbox = '<xml>';
    //toolbox += '<category name="Actions">';
    toolbox += '  <block type="move"></block>';
    toolbox += '  <block type="take"></block>';
    toolbox += '  <block type="recycle"></block>';
    toolbox += '  <block type="put"></block>';
    //toolbox += '</category>';
    //toolbox += '<category name="Control">';
    toolbox += '  <block type="controls_if"></block>';
    toolbox += '  <block type="logic_negate"></block>';
    toolbox += '  <block type="trash"></block>';
    toolbox += '  <block type="count_things"></block>';
    toolbox += '  <block type="controls_repeat"></block>';
    toolbox += '  <block type="controls_whileUntil"></block>';
    //toolbox += '  <block type="procedures_defnoreturn"></block>';
    //toolbox += '</category>';
    toolbox += '</xml>';

    Blockly.inject(document.getElementById('command-box-content'), {toolbox: toolbox, trashcan: true});

    // initial code
    var code = '<xml xmlns="http://www.w3.org/1999/xhtml">'
        +'<block type="move" id="10" x="30" y="30">'
        +'  <field name="direction">\'right\'</field>'
        +'<next>'
        +'<block type="controls_if" id="11" inline="false">'
        +'<value name="IF0">'
        +'<block type="trash" id="12"></block>'
        +'</value>'
        +' <statement name="DO0">'
        +'<block type="take" id="13"></block>'
        +'</statement>'
        +'</block>'
        +'</next>'
        +'</block>'
        +'</xml>';
    //var code =
    //      '<xml xmlns="http://www.w3.org/1999/xhtml">'
    //    + '  <block type="move" id="10" x="30" y="30">'
    //    + '    <field name="direction">\'right\'</field>'
    //    + '  </block>'
    //    + '</xml>';
    var xml = Blockly.Xml.textToDom(code);
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
});

function addBlockMove() {
    Blockly.Blocks['move'] = {
        init: function () {
            this.setColour(30);
            this.appendDummyInput()
                .appendField("move")
                .appendField(new Blockly.FieldDropdown([["right →", "'right'"], ["left ←", "'left'"], ["up ↑", "'up'"], ["down ↓", "'down'"]]), "direction");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setTooltip('');
        }
    };

    Blockly.JavaScript['move'] = function(block) {
        var direction = block.getFieldValue('direction') || '""';
        return 'move(' + direction + ');\n';
    };
}

function addBlockTake() {
    Blockly.Blocks['take'] = {
        init: function () {
            this.setColour(120);
            this.appendDummyInput()
                .appendField("take garbage");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setTooltip('');
        }
    };

    Blockly.JavaScript['take'] = function(block) {
        return 'take();\n';
    };
}

function addBlockRecycle() {
    Blockly.Blocks['recycle'] = {
        init: function() {
            this.setColour(120);
            this.appendDummyInput()
                //.setAlign(Blockly.ALIGN_RIGHT)
                .appendField("recycle 5 of")
                .appendField(new Blockly.FieldDropdown([["paper", "'paper'"], ["plastic", "'plastic'"], ["glass", "'bottle'"], ["metal", "'metal'"], ["chemicals", "'chemicals'"]]), "trashA");
            //this.appendDummyInput()
            //    .setAlign(Blockly.ALIGN_RIGHT)
            //    .appendField("and")
            //    .appendField(new Blockly.FieldDropdown([["paper", "'paper'"], ["plastic", "'plastic'"], ["glass", "'glass'"], ["metal", "'metal'"], ["chemicals", "'chemicals'"]]), "trashB");
            this.setInputsInline(true);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setTooltip('');
        }
    };

    Blockly.JavaScript['recycle'] = function(block) {
        var dropdown_trashA = block.getFieldValue('trashA');
        //var dropdown_trashB = block.getFieldValue('trashB');
        //return 'recycle(' + dropdown_trashA + ', ' + dropdown_trashB + ');\n';
        return 'recycle(' + dropdown_trashA + ');\n';
    };
}

function addBlockPut() {
    Blockly.Blocks['put'] = {
        init: function() {
            this.setColour(120);
            this.appendDummyInput()
                .appendField("put");
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([["water", "'water'"], ["road", "'stone'"], ["grass", "'grass'"], ["soil", "'dirt'"]]), "thing");
            this.setInputsInline(true);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setTooltip('');
        }
    };

    Blockly.JavaScript['put'] = function(block) {
        var dropdown_thing = block.getFieldValue('thing');
        return 'put(' + dropdown_thing + ');\n';
    };
}

function addBlockTrash()
{
    Blockly.Blocks['trash'] = {
        init: function() {
            this.setColour(210);
            this.appendDummyInput()
                .appendField("garbage found");
            this.setOutput(true, "Boolean");
            this.setTooltip('');
        }
    };

    Blockly.JavaScript['trash'] = function(block) {
        var code = 'trashIsDetected()';
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
}

function addBlockCountThings()
{
    Blockly.Blocks['count_things'] = {
        init: function() {
            this.setColour(210);
            this.appendDummyInput()
                .appendField("count");
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([["paper", "'paper'"], ["plastic", "'plastic'"], ["glass", "'bottle'"], ["metal", "'metal'"], ["chemicals", "'chemicals'"], ["water", "'water'"], ["road", "'stone'"], ["grass", "'grass'"], ["soil", "'dirt'"]]), "thing");
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([[">", "'GT'"], ["<", "'LT'"], ["=", "'EQ'"]]), "relation");
            this.appendDummyInput()
                .appendField(new Blockly.FieldTextInput("5",
                    Blockly.FieldTextInput.nonnegativeIntegerValidator), "number");
            this.setInputsInline(true);
            this.setOutput(true, "Boolean");
            this.setTooltip('');
        }
    };

    Blockly.JavaScript['count_things'] = function(block) {
        var dropdown_thing = block.getFieldValue('thing');
        var dropdown_relation = block.getFieldValue('relation');
        var dropdown_number = Number(block.getFieldValue('number'));
        //var dropdown_trashB = block.getFieldValue('trashB');
        //return 'recycle(' + dropdown_trashA + ', ' + dropdown_trashB + ');\n';
        return ['countThings(' + dropdown_thing + ', ' + dropdown_relation + ', ' + dropdown_number + ')', Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

}