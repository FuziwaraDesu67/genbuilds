from psd_tools import PSDImage

def inspect_psd(file_path):
    print(f"=== Inspecting {file_path} ===")
    try:
        psd = PSDImage.open(file_path)
        print(f"Size: {psd.width}x{psd.height}")
        
        def print_layers(layers, indent=""):
            for layer in layers:
                # Basic info
                info = f"{indent}- {layer.name} (Type: {layer.kind}, Visible: {layer.visible})"
                
                # If it's a text layer, extract text
                if layer.kind == 'type':
                    try:
                        text = layer.text
                        info += f"\n{indent}  Text: {text.strip()[:100]}"
                    except:
                        pass
                
                print(info)
                
                # Recurse if group
                if layer.is_group():
                    print_layers(layer, indent + "  ")

        print_layers(psd)
        print("\n")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

if __name__ == '__main__':
    inspect_psd('design-source/Card mock-up.psb')
    inspect_psd('design-source/drop-summary-template.psd')
